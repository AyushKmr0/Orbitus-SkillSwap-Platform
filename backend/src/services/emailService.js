import nodemailer from 'nodemailer';

const requiredEmailEnv = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];

const ensureEmailConfig = () => {
  const missing = requiredEmailEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing email configuration: ${missing.join(', ')}`);
  }
};

const createTransporter = () => {
  ensureEmailConfig();

  const port = Number(process.env.EMAIL_PORT);

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

export const sendOtpEmail = async ({ to, name, code, purpose = 'verify your email' }) => {
  const transporter = createTransporter();
  const appName = process.env.APP_NAME || 'Orbitus';
  const from = process.env.EMAIL_FROM || `"${appName}" <${process.env.EMAIL_USER}>`;

  await transporter.sendMail({
    from,
    to,
    subject: `${appName} OTP Code`,
    text: `Hi ${name || 'there'},\n\nYour OTP code to ${purpose} is ${code}. It expires in 15 minutes.\n\nIf you did not request this, you can ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827;">
        <h2>${appName}</h2>
        <p>Hi ${name || 'there'},</p>
        <p>Your OTP code to ${purpose} is:</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 4px;">${code}</p>
        <p>This code expires in 15 minutes.</p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `
  });
};
