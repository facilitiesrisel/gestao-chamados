import "dotenv/config";
import nodemailer from "nodemailer";

async function test() {
  console.log("Testing SMTP with", process.env.SMTP_USER);
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    tls: { rejectUnauthorized: false },
  });
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: process.env.SMTP_USER,
      subject: "Teste de Envio de E-mail Risel",
      html: "<h1>Funcionou!</h1><p>O teste de email SMTP foi concluído com sucesso.</p>",
    });
    console.log("Sucesso! Message ID:", info.messageId);
  } catch (e: any) {
    console.error("Erro no SMTP:", e.message);
  }
}
test();
