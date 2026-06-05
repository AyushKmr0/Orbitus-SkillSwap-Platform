import nodemailer from 'nodemailer';

const requiredEmailEnv = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
const DEFAULT_CONNECTION_TIMEOUT_MS = 10000;
const DEFAULT_GREETING_TIMEOUT_MS = 10000;
const DEFAULT_SOCKET_TIMEOUT_MS = 20000;

const isEmailFlagEnabled = (key) => String(process.env[key] || '').toLowerCase() === 'true';

const elapsedMs = (startedAt) => Date.now() - startedAt;

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
  const requireTLS = process.env.EMAIL_REQUIRE_TLS
    ? isEmailFlagEnabled('EMAIL_REQUIRE_TLS')
    : port === 587;

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure,
    requireTLS,
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
      servername: process.env.EMAIL_HOST,
      rejectUnauthorized: process.env.EMAIL_TLS_REJECT_UNAUTHORIZED
        ? isEmailFlagEnabled('EMAIL_TLS_REJECT_UNAUTHORIZED')
        : true
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
    requireTLS: process.env.EMAIL_REQUIRE_TLS
      ? isEmailFlagEnabled('EMAIL_REQUIRE_TLS')
      : port === 587,
    userConfigured: Boolean(process.env.EMAIL_USER),
    from: process.env.EMAIL_FROM
  });
};

export const sendOtpEmail = async ({ to, name, code, purpose = 'verify your email' }) => {
  const transporter = createTransporter();
  const appName = process.env.APP_NAME || 'Orbitus';
  const from = process.env.EMAIL_FROM || `"${appName}" <${process.env.EMAIL_USER}>`;
  const shouldVerifyBeforeSend =
    isEmailFlagEnabled('EMAIL_VERIFY_BEFORE_SEND') || process.env.NODE_ENV !== 'production';

  emailLog('Preparing OTP email', {
    to,
    purpose,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    from
  });

  try {
    if (shouldVerifyBeforeSend) {
      const verifyStartedAt = Date.now();
      emailLog('SMTP verify started', {
        environment: process.env.NODE_ENV || 'development'
      });

      try {
        await transporter.verify();
      } catch (error) {
        emailLog('SMTP verify failed', {
          durationMs: elapsedMs(verifyStartedAt),
          ...describeMailError(error)
        });
        throw error;
      }

      emailLog('SMTP verify successful', {
        durationMs: elapsedMs(verifyStartedAt)
      });
    } else {
      emailLog('SMTP verify skipped', {
        environment: process.env.NODE_ENV,
        reason: 'production sends directly with sendMail()'
      });
    }

    const sendStartedAt = Date.now();
    emailLog('SMTP sendMail started', {
      to
    });

    let info;

    try {
      info = await transporter.sendMail({
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
    } catch (error) {
      emailLog('SMTP sendMail failed', {
        to,
        durationMs: elapsedMs(sendStartedAt),
        ...describeMailError(error)
      });
      throw error;
    }

    emailLog('OTP email sent successfully', {
      to,
      durationMs: elapsedMs(sendStartedAt),
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
