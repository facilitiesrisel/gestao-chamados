import express from "express";
import path from "path";
import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

dotenv.config();

// Handler global: impede que rejeições assíncronas do SDK do Google Cloud (Firestore/gRPC)
// derrubem o servidor quando as credenciais padrão (ADC) não estão configuradas localmente.
process.on("unhandledRejection", (reason: any) => {
  const msg = String(reason?.message || reason || "");
  if (
    msg.includes("Could not load the default credentials") ||
    msg.includes("All promises were rejected") ||
    msg.includes("MetadataLookupWarning")
  ) {
    console.warn("[Firebase/gRPC] Credencial padrão ausente — operação ignorada de forma resiliente.");
  } else {
    console.error("[unhandledRejection]", reason);
  }
});

// Inicialização opcional e resiliente do Firebase Firestore
let db: any = null;
let isFirebaseConfigured = false;

try {
  let projectId = process.env.FIREBASE_PROJECT_ID;
  let databaseId = process.env.FIREBASE_DATABASE_ID || process.env.FIREBASE_FIRESTORE_DATABASE_ID;

  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      projectId = projectId || config.projectId;
      databaseId = databaseId || config.firestoreDatabaseId;
    } catch (e) {
      console.warn("Falha ao ler firebase-applet-config.json:", e);
    }
  }

  // Tenta carregar e validar a Service Account primeiro para extrair o Project ID de forma resiliente
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_FIRESTORE;
  let parsedCredentials: any = null;
  
  if (serviceAccountKey) {
    try {
      let cleanKey = serviceAccountKey.trim();
      // Caso a chave tenha sido salva com aspas externas extras, remove-las
      if (cleanKey.startsWith('"') && cleanKey.endsWith('"') && cleanKey.length > 2) {
        cleanKey = cleanKey.slice(1, -1);
      }
      
      parsedCredentials = JSON.parse(cleanKey);
      // Garante que eventuais quebras de linha escapadas como '\\n' no Render sejam convertidas para quebras reais '\n'
      if (parsedCredentials.private_key) {
        parsedCredentials.private_key = parsedCredentials.private_key.replace(/\\n/g, '\n');
      }
      
      // Auto-recuperação do Project ID a partir da própria Service Account se estiver ausente
      if (parsedCredentials.project_id) {
        projectId = projectId || parsedCredentials.project_id;
      }
      console.log("Service Account do Firebase carregada e pré-validada com sucesso!");
    } catch (err: any) {
      console.error("Erro ao analisar a variável de Service Account do Firebase:", err.message);
    }
  }

  if (projectId) {
    const configOptions: admin.AppOptions = {
      projectId: projectId,
    };

    if (parsedCredentials) {
      configOptions.credential = (admin as any).cert(parsedCredentials);
    }

    let app;
    try {
      app = (admin as any).app();
    } catch {
      app = admin.initializeApp(configOptions);
    }
    
    db = getFirestore(app, databaseId || undefined);
    isFirebaseConfigured = true;
    console.log(`Firebase Firestore inicializado com sucesso! Project ID: ${projectId}, ID do Banco: ${databaseId || "(default)"}${parsedCredentials ? " (Utilizando Service Account)" : ""}`);
  } else {
    console.warn("Nenhuma configuração do Firebase encontrada (arquivo ou variáveis de ambiente). Utilizando armazenamento em memória de fallback.");
  }
} catch (err) {
  console.error("Erro ao inicializar Firebase Admin:", err);
}

// Armazenamento em memória do servidor caso o Firebase não esteja ativo ou falhe
let ticketsMemoryFallback: any[] = [];
let maintenanceItemsMemoryFallback: any[] = [];
let operationalBasesMemoryFallback: any[] = [];
let urgencyConfigsMemoryFallback: any[] = [];
let adminUsersMemoryFallback: any[] = [];

// Função de envio de e-mail via SendGrid API HTTP (bypass de bloqueio SMTP do Render)
async function sendMailWithFallback(_smtpUser: string, _smtpPass: string, mailOptions: { from?: string; to: string | string[]; cc?: string; subject: string; html: string; attachments?: any[] }) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error("SENDGRID_API_KEY não configurada. Cadastre a variável de ambiente no Render.");
  }

  sgMail.setApiKey(apiKey);

  const msg: any = {
    to: mailOptions.to,
    from: mailOptions.from || "facilitiesrisel@gmail.com",
    subject: mailOptions.subject,
    html: mailOptions.html,
  };

  if (mailOptions.cc) {
    msg.cc = mailOptions.cc;
  }

  if (mailOptions.attachments && mailOptions.attachments.length > 0) {
    msg.attachments = mailOptions.attachments.map((att: any) => ({
      content: att.content || "",
      filename: att.filename || "anexo",
      type: att.contentType || "application/octet-stream",
      disposition: "attachment",
    }));
  }

  console.log(`[SendGrid] Enviando e-mail para ${msg.to}...`);
  const [response] = await sgMail.send(msg);
  console.log(`[SendGrid] E-mail enviado com sucesso! Status: ${response.statusCode}`);
  return { messageId: response.headers["x-message-id"] || "enviado" };
}

const JWT_SECRET = process.env.JWT_SECRET || "fallback_segredo_super_secreto_desenvolvimento_risel";

// Middleware para validar token JWT nas rotas protegidas
function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Token de autenticação ausente ou inválido." });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ error: "Sessão expirada ou acesso negado. Faça login novamente." });
    }
    req.user = user;
    next();
  });
}

const app = express();

async function startServer() {
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  // Permite payloads maiores para suportar anexos de imagem se necessário
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // --- ROTAS DO FIREBASE / TICKETS ---

  // Obter status da integração para exibir ao administrador se desejado
  app.get("/api/db-status", (req, res) => {
    res.json({
      configured: isFirebaseConfigured,
      provider: isFirebaseConfigured ? "Firebase Firestore (Nuvem)" : "Local Storage / Memória Fallback"
    });
  });

  // Obter todos os chamados
  app.get("/api/tickets", async (req, res) => {
    try {
      if (db) {
        const snapshot = await db.collection("tickets").get();
        // Em Firestore, ordenamos em memória de forma confiável e rápida
        const tickets = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() }));
        tickets.sort((a: any, b: any) => {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        });
        return res.json(tickets);
      } else {
        return res.json(ticketsMemoryFallback);
      }
    } catch (err: any) {
      console.error("Exceção na rota GET /api/tickets:", err);
      return res.json(ticketsMemoryFallback);
    }
  });

  // Sincronizar estado inicial do frontend (se o banco estiver vazio, aceita os padrões do localStorage)
  app.post("/api/tickets/sync", async (req, res) => {
    try {
      const { tickets } = req.body;
      if (!Array.isArray(tickets)) {
        return res.status(400).json({ error: "Lista de tickets inválida" });
      }

      ticketsMemoryFallback = [...tickets];

      if (db) {
        const ticketsRef = db.collection("tickets");
        const snapshot = await ticketsRef.limit(1).get();

        if (snapshot.empty) {
          const realTickets = tickets.filter((t: any) => !t.id.startsWith("dummy_") && !t.id.startsWith("ticket_1"));
          if (realTickets.length > 0) {
            const batch = db.batch();
            realTickets.forEach((t: any) => {
              const ref = ticketsRef.doc(t.id);
              batch.set(ref, t);
            });
            await batch.commit();
            console.log(`Sincronizados ${realTickets.length} tickets reais com o Firestore!`);
          }
        }
      }
      return res.json({ success: true });
    } catch (err: any) {
      console.error("Erro na sincronização de dados:", err);
      return res.json({ success: true });
    }
  });

  // --- ROTAS DO FIREBASE / CADASTROS OPERACIONAIS DO MENU ADMIN ---

  // 1. Itens Prediais de Manutenção
  app.get("/api/maintenance-items", async (req, res) => {
    try {
      if (db) {
        const snapshot = await db.collection("maintenance_items").get();
        const items = snapshot.docs.map((doc: any) => doc.data());
        items.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
        return res.json(items);
      }
      return res.json(maintenanceItemsMemoryFallback);
    } catch (err: any) {
      console.error("Exceção na rota GET /api/maintenance-items:", err);
      return res.json(maintenanceItemsMemoryFallback);
    }
  });

  app.post("/api/maintenance-items/sync", async (req, res) => {
    try {
      const { items } = req.body;
      if (!Array.isArray(items)) return res.status(400).json({ error: "Dados inválidos" });
      
      maintenanceItemsMemoryFallback = [...items];

      if (db) {
        const colRef = db.collection("maintenance_items");
        const snapshot = await colRef.get();
        const batch = db.batch();
        
        snapshot.docs.forEach((doc: any) => batch.delete(doc.ref));
        items.forEach((item: any) => {
          const ref = colRef.doc(item.id || item.name);
          batch.set(ref, item);
        });
        await batch.commit();
      }
      return res.json({ success: true, data: maintenanceItemsMemoryFallback });
    } catch (err: any) {
      console.error("Erro ao salvar itens prediais:", err);
      return res.json({ success: true, data: maintenanceItemsMemoryFallback });
    }
  });

  // 2. Bases Operacionais
  app.get("/api/operational-bases", async (req, res) => {
    try {
      if (db) {
        const snapshot = await db.collection("operational_bases").get();
        const bases = snapshot.docs.map((doc: any) => doc.data());
        bases.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
        return res.json(bases);
      }
      return res.json(operationalBasesMemoryFallback);
    } catch (err: any) {
      console.error("Exceção na rota GET /api/operational-bases:", err);
      return res.json(operationalBasesMemoryFallback);
    }
  });

  app.post("/api/operational-bases/sync", async (req, res) => {
    try {
      const { bases } = req.body;
      if (!Array.isArray(bases)) return res.status(400).json({ error: "Dados inválidos" });

      operationalBasesMemoryFallback = [...bases];

      if (db) {
        const colRef = db.collection("operational_bases");
        const snapshot = await colRef.get();
        const batch = db.batch();
        
        snapshot.docs.forEach((doc: any) => batch.delete(doc.ref));
        bases.forEach((base: any) => {
          const ref = colRef.doc(base.id || base.name);
          batch.set(ref, base);
        });
        await batch.commit();
      }
      return res.json({ success: true, data: operationalBasesMemoryFallback });
    } catch (err: any) {
      console.error("Erro ao salvar bases operacionais:", err);
      return res.json({ success: true, data: operationalBasesMemoryFallback });
    }
  });

  // 3. Configurações de Urgência
  app.get("/api/urgency-configs", async (req, res) => {
    try {
      if (db) {
        const snapshot = await db.collection("urgency_configs").get();
        const configs = snapshot.docs.map((doc: any) => doc.data());
        return res.json(configs);
      }
      return res.json(urgencyConfigsMemoryFallback);
    } catch (err: any) {
      console.error("Exceção na rota GET /api/urgency-configs:", err);
      return res.json(urgencyConfigsMemoryFallback);
    }
  });

  app.post("/api/urgency-configs/sync", async (req, res) => {
    try {
      const { configs } = req.body;
      if (!Array.isArray(configs)) return res.status(400).json({ error: "Dados inválidos" });

      urgencyConfigsMemoryFallback = [...configs];

      if (db) {
        const colRef = db.collection("urgency_configs");
        const snapshot = await colRef.get();
        const batch = db.batch();
        
        snapshot.docs.forEach((doc: any) => batch.delete(doc.ref));
        configs.forEach((config: any) => {
          const ref = colRef.doc(config.id || config.priority);
          batch.set(ref, config);
        });
        await batch.commit();
      }
      return res.json({ success: true, data: urgencyConfigsMemoryFallback });
    } catch (err: any) {
      console.error("Erro ao salvar configurações de urgência:", err);
      return res.json({ success: true, data: urgencyConfigsMemoryFallback });
    }
  });

  // 4. Administradores / Gestores de Frota
  app.get("/api/admin-users", authenticateToken, async (req, res) => {
    try {
      if (db) {
        const snapshot = await db.collection("admin_users").get();
        const users = snapshot.docs.map((doc: any) => doc.data());
        users.sort((a: any, b: any) => (a.name || "").localeCompare(b.name || ""));
        return res.json(users);
      }
      return res.json(adminUsersMemoryFallback);
    } catch (err: any) {
      console.error("Exceção na rota GET /api/admin-users:", err);
      return res.json(adminUsersMemoryFallback);
    }
  });

  app.post("/api/admin-users/sync", authenticateToken, async (req, res) => {
    try {
      const { users } = req.body;
      if (!Array.isArray(users)) return res.status(400).json({ error: "Dados inválidos" });

      // Atualiza o fallback em memória preservando senhas e tokens
      users.forEach((u: any) => {
        const existing = adminUsersMemoryFallback.find(ex => ex.id === u.id);
        if (existing) {
          if (existing.password) u.password = existing.password;
          if (existing.inviteToken) u.inviteToken = existing.inviteToken;
          if (existing.inviteExpires) u.inviteExpires = existing.inviteExpires;
          if (existing.isGeneralAdmin) u.isGeneralAdmin = existing.isGeneralAdmin;
        }
      });
      adminUsersMemoryFallback = [...users];

      if (db) {
        const colRef = db.collection("admin_users");
        const snapshot = await colRef.get();
        const existingDocs = snapshot.docs;

        // Deleta os documentos que não estão no array recebido (foram excluídos no front)
        const sentIds = users.map((u: any) => u.id);
        const batch = db.batch();
        
        existingDocs.forEach((doc: any) => {
          if (!sentIds.includes(doc.id)) {
            batch.delete(doc.ref);
          }
        });
        await batch.commit();

        // Salva os novos ou atualizados preservando campos confidenciais
        for (const user of users) {
          const docRef = colRef.doc(user.id);
          const docSnap = await docRef.get();
          let mergedUser = { ...user };
          
          if (docSnap.exists) {
            const currentData = docSnap.data() || {};
            if (currentData.password) mergedUser.password = currentData.password;
            if (currentData.inviteToken) mergedUser.inviteToken = currentData.inviteToken;
            if (currentData.inviteExpires) mergedUser.inviteExpires = currentData.inviteExpires;
            if (currentData.isGeneralAdmin) mergedUser.isGeneralAdmin = currentData.isGeneralAdmin;
          }
          await docRef.set(mergedUser, { merge: true });
        }
      }
      return res.json({ success: true, data: adminUsersMemoryFallback });
    } catch (err: any) {
      console.error("Erro ao salvar administradores:", err);
      return res.json({ success: true, data: adminUsersMemoryFallback });
    }
  });


  // Cadastrar novo chamado
  app.post("/api/tickets", async (req, res) => {
    try {
      const { ticket } = req.body;
      if (!ticket || !ticket.id) {
        return res.status(400).json({ error: "Dados do chamado inválidos." });
      }

      ticketsMemoryFallback = [ticket, ...ticketsMemoryFallback.filter(t => t.id !== ticket.id)];

      if (db) {
        try {
          await db.collection("tickets").doc(ticket.id).set(ticket);
          return res.json({ success: true, ticket });
        } catch (error: any) {
          console.error("Erro ao inserir chamado no Firestore:", error);
          return res.json({ success: true, ticket });
        }
      } else {
        return res.json({ success: true, ticket });
      }
    } catch (err: any) {
      console.error("Erro ao salvar chamado:", err);
      return res.json({ success: true, ticket: req.body.ticket });
    }
  });

  // Atualizar chamado
  app.put("/api/tickets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { ticket } = req.body;
      if (!ticket) {
        return res.status(400).json({ error: "Dados do chamado ausentes." });
      }

      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      let isAuthenticated = false;
      if (token) {
        try {
          jwt.verify(token, JWT_SECRET);
          isAuthenticated = true;
        } catch (jwtErr) {
          // Token inválido, mas não falha imediatamente pois pode ser o solicitante avaliando
        }
      }

      if (isAuthenticated) {
        // Admin autenticado: pode atualizar o ticket completo
        ticketsMemoryFallback = ticketsMemoryFallback.map(t => t.id === id ? ticket : t);

        if (db) {
          try {
            await db.collection("tickets").doc(id).set(ticket, { merge: true });
          } catch (dbErr) {
            console.error("Erro ao atualizar chamado no Firestore (Admin):", dbErr);
          }
        }
        return res.json({ success: true, ticket });
      } else {
        // Solicitante comum: só pode atualizar satisfactionRating e feedbackText
        const rating = ticket.satisfactionRating;
        const feedback = ticket.feedbackText;

        // Se o solicitante tentar alterar outros campos confidenciais sem token, bloqueia
        // (exemplo simples de proteção contra injeção direta)
        
        // Atualiza fallback em memória
        ticketsMemoryFallback = ticketsMemoryFallback.map(t => {
          if (t.id === id) {
            return {
              ...t,
              satisfactionRating: rating,
              feedbackText: feedback,
              updatedAt: new Date().toISOString()
            };
          }
          return t;
        });

        if (db) {
          try {
            await db.collection("tickets").doc(id).update({
              satisfactionRating: rating !== undefined ? rating : null,
              feedbackText: feedback !== undefined ? feedback : "",
              updatedAt: new Date().toISOString()
            });
          } catch (dbErr) {
            console.error("Erro ao atualizar feedback no Firestore (Público):", dbErr);
          }
        }

        const updatedTicketInMem = ticketsMemoryFallback.find(t => t.id === id) || ticket;
        return res.json({ success: true, ticket: updatedTicketInMem });
      }
    } catch (err: any) {
      console.error("Erro ao atualizar chamado:", err);
      return res.status(500).json({ error: "Erro interno no servidor ao atualizar chamado." });
    }
  });

  // Excluir chamado individualmente
  app.delete("/api/tickets/:id", authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      ticketsMemoryFallback = ticketsMemoryFallback.filter(t => t.id !== id);

      if (db) {
        try {
          await db.collection("tickets").doc(id).delete();
          console.log(`Chamado ${id} excluído com sucesso do Firestore.`);
        } catch (error: any) {
          console.error(`Erro ao excluir chamado ${id} do Firestore:`, error);
          return res.status(500).json({ error: "Erro ao excluir no banco de dados." });
        }
      }
      return res.json({ success: true, message: "Chamado excluído com sucesso!" });
    } catch (err: any) {
      console.error("Erro ao excluir chamado:", err);
      return res.status(500).json({ error: "Erro no servidor ao excluir chamado." });
    }
  });

  // Zerar todos os chamados (Banco de Dados de Chamados)
  app.post("/api/tickets/reset", authenticateToken, async (req, res) => {
    try {
      ticketsMemoryFallback = [];

      if (db) {
        try {
          const colRef = db.collection("tickets");
          const snapshot = await colRef.get();
          const batch = db.batch();
          snapshot.docs.forEach((doc: any) => batch.delete(doc.ref));
          await batch.commit();
          console.log("Banco de dados de chamados (tickets) zerado com sucesso!");
        } catch (error: any) {
          console.error("Erro ao zerar coleção tickets no Firestore:", error);
          return res.status(500).json({ error: "Erro ao zerar banco de dados na nuvem." });
        }
      }
      return res.json({ success: true, message: "Todos os chamados foram removidos com sucesso!" });
    } catch (err: any) {
      console.error("Erro ao processar reset de chamados:", err);
      return res.status(500).json({ error: "Erro no servidor ao zerar chamados." });
    }
  });

  // Endpoint da API para envio de e-mails de chamados
  app.post("/api/send-email", async (req, res) => {
    try {
      const { ticket, isUpdate, updateMessage } = req.body;
      if (!ticket) {
        return res.status(400).json({ error: "Dados do chamado não informados." });
      }

      const smtpUser = process.env.SMTP_USER || "facilitiesrisel@gmail.com";
      const smtpPass = process.env.SMTP_PASS || "@Cap150957";

      // Formatar data no padrão brasileiro dd/mm/aaaa hh:mm
      const formatDateBr = (dateStr: string) => {
        if (!dateStr) return "-";
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
      };

      const ticketDateBr = formatDateBr(ticket.createdAt);
      const limitDateBr = formatDateBr(ticket.slaTargetDate);

      // Assunto do E-mail
      const subject = isUpdate 
        ? `[Risel Facilities] Atualização de Status: Chamado ${ticket.id}`
        : `[Risel Facilities] Chamado Registrado com Sucesso: ${ticket.id}`;

      // Corpo em HTML bem desenhado e profissional
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="background-color: #1e293b; padding: 24px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 0.5px;">RISEL FACILITIES</h1>
            <p style="margin: 6px 0 0 0; font-size: 12px; color: #247d52; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Gestão de Manutenção Predial</p>
          </div>
          
          <div style="padding: 28px; color: #334155; line-height: 1.6;">
            ${isUpdate ? `
              <div style="background-color: #f0fdf4; border-left: 4px solid #247d52; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 6px 0; color: #166534; font-size: 15px; font-weight: 800;">Status do Chamado Atualizado!</h3>
                <p style="margin: 0; font-size: 13.5px; color: #15803d; font-weight: 500;">${updateMessage || "O status ou informações do seu chamado de facilities foram atualizados."}</p>
              </div>
            ` : `
              <p style="font-size: 15px; margin-top: 0; color: #1e293b;">Olá, <strong>${ticket.requesterName}</strong>,</p>
              <p style="font-size: 14px; color: #475569;">Confirmamos o registro do seu chamado de manutenção preventiva/corretiva na base da Risel. Uma notificação foi enviada ao time operacional.</p>
            `}

            <div style="background-color: #f8fafc; border: 1px solid #f1f5f9; border-radius: 12px; padding: 20px; margin: 24px 0;">
              <h2 style="margin: 0 0 14px 0; font-size: 13px; color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px;">Especificações da Solicitação</h2>
              
              <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 150px;">Código do Chamado:</td>
                  <td style="padding: 8px 0; color: #247d52; font-weight: 800; font-family: monospace; font-size: 15px;">${ticket.id}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Status Atual:</td>
                  <td style="padding: 8px 0;">
                    <span style="background-color: #f1f5f9; color: #1e293b; border: 1px solid #cbd5e1; padding: 3px 10px; border-radius: 8px; font-weight: 700; font-size: 11px;">
                      ${ticket.status}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Item Predial:</td>
                  <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${ticket.category}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Subitem / Problema:</td>
                  <td style="padding: 8px 0; color: #334155;">${ticket.subitem || "Geral"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Prioridade:</td>
                  <td style="padding: 8px 0; color: #b91c1c; font-weight: 700;">${ticket.priority}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Base Operacional:</td>
                  <td style="padding: 8px 0; color: #334155; font-weight: 500;">${ticket.operationalBase || "Risel"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Setor / Local:</td>
                  <td style="padding: 8px 0; color: #334155; font-weight: 500;">${ticket.location}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Data de Abertura:</td>
                  <td style="padding: 8px 0; color: #334155;">${ticketDateBr}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Prazo SLA:</td>
                  <td style="padding: 8px 0; color: #247d52; font-weight: 700;">${limitDateBr}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 0 0 0; color: #64748b; font-weight: 600; vertical-align: top;" colspan="2">Relato do Problema:</td>
                </tr>
                <tr>
                  <td style="padding: 10px; color: #334155; font-style: italic; background-color: #ffffff; border-radius: 8px; border: 1px dashed #cbd5e1; margin-top: 6px;" colspan="2">
                    ${ticket.description}
                  </td>
                </tr>
              </table>
            </div>

            <p style="font-size: 13px; color: #64748b; margin-bottom: 24px;">Você pode rastrear a resolução e interagir diretamente por meio do canal de acompanhamento do painel utilizando o seu código.</p>
            
            <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 24px;">
              <span style="font-size: 11px; color: #94a3b8; display: block; font-weight: 500;">E-mail disparado automaticamente pelo Serviço de Facilities da Risel.</span>
              <span style="font-size: 11px; color: #94a3b8; display: block; font-weight: 500; margin-top: 2px;">&copy; Risel Facilities. Todos os direitos reservados.</span>
            </div>
          </div>
        </div>
      `;

      // Coleta dinâmica de todos os e-mails de administradores ativos
      let activeAdminEmails: string[] = [];
      if (db) {
        try {
          const adminsSnapshot = await db.collection("admin_users").where("active", "==", true).get();
          adminsSnapshot.docs.forEach((doc: any) => {
            const adminData = doc.data();
            if (adminData.email) {
              activeAdminEmails.push(adminData.email.trim());
            }
          });
        } catch (e) {
          console.error("Erro ao buscar administradores ativos do Firestore para envio de e-mail:", e);
        }
      }
      if (activeAdminEmails.length === 0) {
        activeAdminEmails = adminUsersMemoryFallback
          .filter(u => u.active && u.email)
          .map(u => u.email.trim());
      }

      const ccList: string[] = [];
      activeAdminEmails.forEach(email => {
        const normalized = email.trim().toLowerCase();
        const normalizedSmtp = smtpUser.trim().toLowerCase();
        if (normalized !== normalizedSmtp && normalized !== "facilitiesrisel@gmail.com" && !ccList.includes(email)) {
          ccList.push(email);
        }
      });

      // Garante que o gestor geral deny.goncalves@risel.com.br esteja sempre em cópia
      if (!ccList.includes("deny.goncalves@risel.com.br") && smtpUser.trim().toLowerCase() !== "deny.goncalves@risel.com.br") {
        ccList.push("deny.goncalves@risel.com.br");
      }

      // Processar anexos (fotos) de forma robusta
      const attachments = [];
      if (ticket.photos && Array.isArray(ticket.photos)) {
        ticket.photos.forEach((photo: string, index: number) => {
          if (photo.startsWith("data:")) {
            const matches = photo.match(/^data:(image\/\w+);base64,(.+)$/);
            if (matches) {
              const contentType = matches[1];
              const extension = contentType.split('/')[1] || 'png';
              const base64Data = matches[2];
              attachments.push({
                filename: `anexo_chamado_${index + 1}.${extension}`,
                content: Buffer.from(base64Data, 'base64'),
                contentType: contentType
              });
            }
          } else if (photo.startsWith("http")) {
            attachments.push({
              filename: `anexo_chamado_${index + 1}.jpg`,
              path: photo
            });
          }
        });
      }

      const mailOptions = {
        from: `"Risel Facilities" <${smtpUser}>`,
        to: ticket.requesterEmail,
        cc: ccList.join(", "),
        subject: subject,
        html: htmlContent,
        attachments: attachments,
      };

      await sendMailWithFallback(smtpUser, smtpPass, mailOptions);
      res.json({ success: true, message: "E-mail de notificação enviado com sucesso!" });
    } catch (error: any) {
      console.error("Erro ao enviar e-mail via SMTP Gmail:", error);
      res.status(500).json({ error: "Falha ao enviar e-mail de notificação: " + error.message });
    }
  });

  // Teste de envio de e-mail via SendGrid API
  app.post("/api/test-email", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "E-mail de teste de destino não informado." });
      }

      const smtpUser = process.env.SMTP_USER || "facilitiesrisel@gmail.com";
      const smtpPass = process.env.SMTP_PASS || "";

      const mailOptions = {
        from: `"Risel Facilities" <${smtpUser}>`,
        to: email,
        subject: "[Risel Facilities] E-mail de Teste de Diagnóstico",
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #cbd5e1; border-radius: 12px; padding: 24px; background-color: #f8fafc;">
            <h2 style="color: #0f172a; margin-top: 0;">✓ Teste de e-mail bem-sucedido!</h2>
            <p style="color: #334155; font-size: 14px; line-height: 1.5;">O seu servidor configurado no Render conseguiu enviar esta mensagem com sucesso via SendGrid API.</p>
            <div style="margin-top: 20px; padding: 12px; background-color: #f1f5f9; border-radius: 8px; font-size: 12px; color: #475569;">
              <strong>Configuração utilizada:</strong><br>
              • Remetente: ${smtpUser}<br>
              • Transporte: SendGrid API (HTTPS)
            </div>
          </div>
        `
      };

      await sendMailWithFallback(smtpUser, smtpPass, mailOptions);
      return res.json({ success: true, message: "E-mail enviado com sucesso!" });
    } catch (error: any) {
      console.error("Erro no teste de e-mail:", error);
      let advice = "Dica: Verifique se a variável SENDGRID_API_KEY está configurada no Render.";
      if (error.response && error.response.body) {
        const sgErrors = error.response.body.errors || [];
        if (sgErrors.some((e: any) => e.message && e.message.includes("verified"))) {
          advice = "Dica: No SendGrid, vá em Settings → Sender Authentication e verifique o e-mail " + (process.env.SMTP_USER || "facilitiesrisel@gmail.com");
        }
      }
      return res.status(500).json({ 
        error: error.message || error, 
        advice,
        code: error.code || "SENDGRID_ERROR"
      });
    }
  });

  // --- ENDPOINTS DE AUTENTICAÇÃO E CONTROLE DE ACESSO ADMINISTRATIVO ---

  // 1. Login Administrativo Real
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Caso especial: deny.goncalves@risel.com.br com a senha @Cap150957
      if (normalizedEmail === "deny.goncalves@risel.com.br" && password === "@Cap150957") {
        const hashedPassword = await bcrypt.hash("@Cap150957", 10);
        let denyUser: any = {
          id: "admin_deny",
          name: "Deny Gonçalves",
          email: "deny.goncalves@risel.com.br",
          phone: "(11) 99999-9999",
          sector: "Facilities",
          active: true,
          isGeneralAdmin: true,
          password: hashedPassword
        };

        if (db) {
          try {
            await db.collection("admin_users").doc(denyUser.id).set(denyUser, { merge: true });
          } catch (dbErr: any) {
            console.error("Erro resiliente: falha ao salvar administrador geral no Firestore:", dbErr.message);
          }
        }
        if (!adminUsersMemoryFallback.some(u => u.email === denyUser.email)) {
          adminUsersMemoryFallback.push(denyUser);
        } else {
          adminUsersMemoryFallback = adminUsersMemoryFallback.map(u => u.email === denyUser.email ? { ...u, active: true, password: hashedPassword, isGeneralAdmin: true } : u);
        }

        const token = jwt.sign(
          { id: denyUser.id, email: denyUser.email, isGeneralAdmin: true },
          JWT_SECRET,
          { expiresIn: "24h" }
        );

        return res.json({ 
          success: true, 
          token,
          user: { name: denyUser.name, email: denyUser.email, sector: denyUser.sector, isGeneralAdmin: true } 
        });
      }

      let user: any = null;
      if (db) {
        try {
          const querySnapshot = await db.collection("admin_users").where("email", "==", normalizedEmail).get();
          if (!querySnapshot.empty) {
            user = querySnapshot.docs[0].data();
          }
        } catch (dbErr: any) {
          console.error("Erro resiliente: falha ao buscar usuário no Firestore, usando fallback de memória:", dbErr.message);
          user = adminUsersMemoryFallback.find(u => u.email.trim().toLowerCase() === normalizedEmail);
        }
      } else {
        user = adminUsersMemoryFallback.find(u => u.email.trim().toLowerCase() === normalizedEmail);
      }

      if (!user) {
        return res.status(401).json({ error: "Usuário ou senha incorretos." });
      }

      if (!user.active) {
        return res.status(403).json({ error: "Sua conta está inativa ou pendente de ativação por e-mail." });
      }

      let isPasswordCorrect = false;
      try {
        isPasswordCorrect = await bcrypt.compare(password, user.password);
      } catch (e) {
        isPasswordCorrect = user.password === password;
      }
      if (!isPasswordCorrect && user.password === password) {
        isPasswordCorrect = true;
      }

      if (!isPasswordCorrect) {
        return res.status(401).json({ error: "Usuário ou senha incorretos." });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, isGeneralAdmin: !!user.isGeneralAdmin },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      return res.json({
        success: true,
        token: token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          sector: user.sector,
          isGeneralAdmin: !!user.isGeneralAdmin
        }
      });
    } catch (err: any) {
      console.error("Erro no login administrativo:", err);
      return res.status(500).json({ error: "Erro interno no servidor ao realizar login." });
    }
  });

  // 2. Enviar convite de novo admin (Gera link e envia por e-mail)
  app.post("/api/admin/invite", authenticateToken, async (req, res) => {
    try {
      const { name, email, phone, sector } = req.body;
      if (!name || !email) {
        return res.status(400).json({ error: "Nome e e-mail são obrigatórios para o convite." });
      }

      const normalizedEmail = email.trim().toLowerCase();

      // Validação do domínio @risel.com.br
      if (!normalizedEmail.endsWith("@risel.com.br")) {
        return res.status(400).json({ error: "O e-mail do administrador deve conter obrigatoriamente o domínio @risel.com.br" });
      }

      // Verifica se o e-mail já existe
      let alreadyExists = false;
      if (db) {
        try {
          const querySnapshot = await db.collection("admin_users").where("email", "==", normalizedEmail).get();
          alreadyExists = !querySnapshot.empty;
        } catch (dbErr: any) {
          console.error("[invite] Erro ao buscar admin no Firestore (continuando com fallback):", dbErr.message);
          alreadyExists = adminUsersMemoryFallback.some(u => u.email.trim().toLowerCase() === normalizedEmail);
        }
      } else {
        alreadyExists = adminUsersMemoryFallback.some(u => u.email.trim().toLowerCase() === normalizedEmail);
      }

      if (alreadyExists) {
        return res.status(400).json({ error: "Este e-mail já está cadastrado no sistema." });
      }

      // Gera token de convite
      const inviteToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const inviteExpires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48h

      const newAdmin = {
        id: "admin_" + Date.now(),
        name: name.trim(),
        email: normalizedEmail,
        phone: phone ? phone.trim() : "",
        sector: sector ? sector.trim() : "Facilities",
        active: false,
        status: "pending_password",
        inviteToken,
        inviteExpires
      };

      if (db) {
        try {
          await db.collection("admin_users").doc(newAdmin.id).set(newAdmin);
        } catch (dbErr: any) {
          console.error("[invite] Erro ao salvar admin no Firestore (salvando em memória):", dbErr.message);
        }
      }
      adminUsersMemoryFallback.push(newAdmin);

      // Envia o e-mail de convite
      const smtpUser = process.env.SMTP_USER || "facilitiesrisel@gmail.com";
      const smtpPass = process.env.SMTP_PASS || "@Cap150957";

      const origin = req.headers.origin || "http://localhost:3000";
      const activationLink = `${origin}/?inviteToken=${inviteToken}`;

      const mailOptions = {
        from: `"Risel Facilities" <${smtpUser}>`,
        to: normalizedEmail,
        subject: "[Risel Facilities] Convite para Acesso Administrativo",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
            <div style="background-color: #002b5c; padding: 24px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">CONVITE ADMINISTRATIVO</h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #247d52; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Risel Facilities</p>
            </div>
            
            <div style="padding: 28px; color: #334155; line-height: 1.6;">
              <p style="font-size: 15px; margin-top: 0; color: #1e293b;">Olá, <strong>${name}</strong>,</p>
              <p style="font-size: 14px; color: #475569;">Você foi convidado para atuar como administrador/técnico no sistema <strong>Risel Facilities</strong>. Para ativar seu cadastro e definir uma senha de acesso segura, clique no botão abaixo:</p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${activationLink}" style="background-color: #002b5c; color: #ffffff; padding: 14px 28px; border-radius: 10px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px; box-shadow: 0 4px 6px rgba(0, 43, 92, 0.15);">
                  Definir Senha e Ativar Conta
                </a>
              </div>

              <p style="font-size: 12.5px; color: #64748b; margin-top: 16px;">
                <em>Atenção: Este convite expira em 48 horas.</em> Se o botão acima não funcionar, copie e cole o link a seguir no seu navegador:
              </p>
              <p style="font-size: 12px; color: #2563eb; word-break: break-all; background-color: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #f1f5f9;">
                ${activationLink}
              </p>

              <div style="text-align: center; border-top: 1px solid #f1f5f9; padding-top: 20px; margin-top: 32px;">
                <span style="font-size: 11px; color: #94a3b8; display: block;">E-mail automático enviado pelo Portal de Facilities da Risel Combustíveis.</span>
              </div>
            </div>
          </div>
        `
      };

      let emailSent = false;
      try {
        await sendMailWithFallback(smtpUser, smtpPass, mailOptions);
        emailSent = true;
      } catch (emailErr: any) {
        console.error("[invite] Erro ao enviar e-mail de convite (convite criado com sucesso):", emailErr.message);
      }
      return res.json({ success: true, message: emailSent ? "Convite enviado com sucesso!" : "Convite criado com sucesso, mas o e-mail pôde ser enviado. Compartilhe o link manualmente.", user: newAdmin, activationLink });
    } catch (err: any) {
      console.error("Erro ao enviar convite administrativo:", err);
      return res.status(500).json({ error: "Erro interno no servidor ao processar convite: " + err.message });
    }
  });

  // 3. Cadastrar senha a partir do Token de Convite
  app.post("/api/admin/setup-password", async (req, res) => {
    try {
      const { inviteToken, password } = req.body;
      if (!inviteToken || !password) {
        return res.status(400).json({ error: "Token e senha são obrigatórios." });
      }

      let user: any = null;
      let userDocId: string | null = null;

      if (db) {
        const querySnapshot = await db.collection("admin_users").where("inviteToken", "==", inviteToken).get();
        if (!querySnapshot.empty) {
          user = querySnapshot.docs[0].data();
          userDocId = querySnapshot.docs[0].id;
        }
      } else {
        user = adminUsersMemoryFallback.find(u => u.inviteToken === inviteToken);
      }

      if (!user) {
        return res.status(400).json({ error: "Link de ativação inválido ou já utilizado." });
      }

      if (user.inviteExpires && new Date() > new Date(user.inviteExpires)) {
        return res.status(400).json({ error: "Este convite expirou. Entre em contato com um administrador geral para reenvio." });
      }

      // Atualiza usuário com hash bcrypt
      const hashedPassword = await bcrypt.hash(password, 10);
      const updatedUser = {
        ...user,
        password: hashedPassword,
        active: true,
        inviteToken: null,
        inviteExpires: null,
        status: "active"
      };

      if (db && userDocId) {
        await db.collection("admin_users").doc(userDocId).set(updatedUser);
      }

      adminUsersMemoryFallback = adminUsersMemoryFallback.map(u => u.id === user.id ? updatedUser : u);

      return res.json({ success: true, message: "Senha definida e conta ativada com sucesso! Você já pode realizar o login." });
    } catch (err: any) {
      console.error("Erro ao definir senha de administrador:", err);
      return res.status(500).json({ error: "Erro interno no servidor ao definir senha." });
    }
  });

  // 4. Trocar a própria senha (Protegido por token)
  app.post("/api/admin/change-password", authenticateToken, async (req, res) => {
    try {
      const { email, oldPassword, newPassword } = req.body;
      if (!email || !oldPassword || !newPassword) {
        return res.status(400).json({ error: "Todos os campos são obrigatórios." });
      }

      const normalizedEmail = email.trim().toLowerCase();

      let user: any = null;
      let userDocId: string | null = null;

      if (db) {
        const querySnapshot = await db.collection("admin_users").where("email", "==", normalizedEmail).get();
        if (!querySnapshot.empty) {
          user = querySnapshot.docs[0].data();
          userDocId = querySnapshot.docs[0].id;
        }
      } else {
        user = adminUsersMemoryFallback.find(u => u.email.trim().toLowerCase() === normalizedEmail);
      }

      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      let isPasswordCorrect = false;
      try {
        isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);
      } catch (e) {
        isPasswordCorrect = user.password === oldPassword;
      }
      if (!isPasswordCorrect && user.password === oldPassword) {
        isPasswordCorrect = true;
      }

      if (!isPasswordCorrect) {
        return res.status(401).json({ error: "A senha atual informada está incorreta." });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const updatedUser = {
        ...user,
        password: hashedNewPassword
      };

      if (db && userDocId) {
        await db.collection("admin_users").doc(userDocId).set(updatedUser);
      }

      adminUsersMemoryFallback = adminUsersMemoryFallback.map(u => u.id === user.id ? updatedUser : u);

      return res.json({ success: true, message: "Senha alterada com sucesso!" });
    } catch (err: any) {
      console.error("Erro ao alterar senha:", err);
      return res.status(500).json({ error: "Erro interno no servidor ao alterar senha." });
    }
  });

  // Middleware do Vite (Desenvolvimento vs Produção)
  // Verificação dupla: se a pasta dist existir, força o modo produção para evitar carregar o Vite Dev Server em servidores externos como Render
  const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(path.join(process.cwd(), "dist"));

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Servidor de e-mails e aplicação rodando com sucesso na porta ${PORT}`);
    });
  }
}

startServer();

export default app;
