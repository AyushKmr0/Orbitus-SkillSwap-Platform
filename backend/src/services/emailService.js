import nodemailer from 'nodemailer';

const requiredEmailEnv = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
const DEFAULT_CONNECTION_TIMEOUT_MS = 10000;
const DEFAULT_GREETING_TIMEOUT_MS = 10000;
const DEFAULT_SOCKET_TIMEOUT_MS = 20000;

const emailLog = (message, meta = {}) => {
  const safeMeta = Object.fromEntries(
    Object.entries(meta).filter(([, value]) => value !== undefined && value !== '')
  );
  console.log('[EMAIL]', message, safeMeta);
};

const ensureEmailConfig = () => {
  const missing = requiredEmailEnv.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing email configuration: ${missing.join(', ')}`);
  }
};

const createTransporter = () => {
  ensureEmailConfig();

  const port = Number(process.env.EMAIL_PORT);
  const secure = String(process.env.EMAIL_SECURE || '').toLowerCase() === 'true' || port === 465;

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure,
    connectionTimeout: Number(process.env.EMAIL_CONNECTION_TIMEOUT_MS) || DEFAULT_CONNECTION_TIMEOUT_MS,
    greetingTimeout: Number(process.env.EMAIL_GREETING_TIMEOUT_MS) || DEFAULT_GREETING_TIMEOUT_MS,
    socketTimeout: Number(process.env.EMAIL_SOCKET_TIMEOUT_MS) || DEFAULT_SOCKET_TIMEOUT_MS,
    logger: process.env.EMAIL_DEBUG === 'true',
    debug: process.env.EMAIL_DEBUG === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      servername: process.env.EMAIL_HOST
    }
  });
};

const describeMailError = (error) => ({
  message: error.message,
  code: error.code,
  command: error.command,
  responseCode: error.responseCode
});

export const logEmailConfigStatus = () => {
  const port = Number(process.env.EMAIL_PORT);
  const missing = requiredEmailEnv.filter((key) => !process.env[key]);

  emailLog('SMTP configuration loaded', {
    configured: missing.length === 0,
    missing: missing.join(', '),
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: String(process.env.EMAIL_SECURE || '').toLowerCase() === 'true' || port === 465,
    userConfigured: Boolean(process.env.EMAIL_USER),
    from: process.env.EMAIL_FROM
  });
};

export const sendOtpEmail = async ({ to, name, code, purpose = 'verify your email' }) => {
  const transporter = createTransporter();
  const appName = process.env.APP_NAME || 'Orbitus';
  const from = process.env.EMAIL_FROM || `"${appName}" <${process.env.EMAIL_USER}>`;

  emailLog('Preparing OTP email', {
    to,
    purpose,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    from
  });

  try {
    emailLog('Opening SMTP connection and authenticating');
    await transporter.verify();
    emailLog('SMTP connection/authentication successful');

    const info = await transporter.sendMail({
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

    emailLog('OTP email sent successfully', {
      to,
      messageId: info.messageId,
      accepted: info.accepted?.join(', '),
      rejected: info.rejected?.join(', ')
    });

    return info;
  } catch (error) {
    emailLog('OTP email failed', describeMailError(error));
    throw error;
  } finally {
    transporter.close();
  }
};
