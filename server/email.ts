import nodemailer from 'nodemailer';

export interface EmailConfigStatus {
  emailConfigured: boolean;
  provider: 'resend' | 'smtp' | 'none';
}

export function getEmailConfigStatus(): EmailConfigStatus {
  if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()) {
    return { emailConfigured: true, provider: 'resend' };
  }
  if (
    (process.env.SMTP_USER && process.env.SMTP_PASS) ||
    (process.env.SMTP_HOST && process.env.SMTP_PORT)
  ) {
    return { emailConfigured: true, provider: 'smtp' };
  }
  return { emailConfigured: false, provider: 'none' };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendOtpEmail(params: {
  toEmail: string;
  recipientName?: string;
  otpCode: string;
  purpose: 'verify_account' | 'login' | 'reset_password';
}): Promise<void> {
  const status = getEmailConfigStatus();
  if (!status.emailConfigured) {
    throw new Error(
      'Email OTP delivery is not configured on the server. Set SMTP_USER and SMTP_PASS (or RESEND_API_KEY) in environment Secrets.'
    );
  }

  const actionLabel =
    params.purpose === 'verify_account'
      ? 'Verify Your WorkerHub Account'
      : params.purpose === 'reset_password'
      ? 'Reset Your WorkerHub Password'
      : 'Your WorkerHub Sign-In Code';

  const safeName = escapeHtml(params.recipientName || 'Worker');
  const subject = `${params.otpCode} — ${actionLabel}`;

  const textBody = [
    `Hello ${params.recipientName || 'Worker'},`,
    '',
    `Your WorkerHub verification code is: ${params.otpCode}`,
    '',
    'This code expires in 10 minutes. Do not share this code with anyone.',
    '',
    'If you did not request this code, you can safely ignore this email.',
  ].join('\n');

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
      <div style="background: #0f172a; color: #ffffff; padding: 16px 20px; border-radius: 12px; margin-bottom: 20px;">
        <h2 style="margin: 0; font-size: 18px; color: #f59e0b;">WorkerHub Singapore</h2>
        <p style="margin: 4px 0 0; font-size: 12px; color: #cbd5e1;">${escapeHtml(actionLabel)}</p>
      </div>
      <p style="font-size: 14px; color: #1e293b; margin: 0 0 12px;">Hello ${safeName},</p>
      <p style="font-size: 14px; color: #334155; margin: 0 0 20px;">Use the 6-digit verification code below to continue:</p>
      <div style="background: #ffffff; border: 2px solid #f59e0b; border-radius: 12px; padding: 16px; text-align: center; margin-bottom: 20px;">
        <span style="font-family: monospace; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #0f172a;">${escapeHtml(params.otpCode)}</span>
      </div>
      <p style="font-size: 12px; color: #64748b; margin: 0;">This code expires in <strong>10 minutes</strong>. Never share your OTP with anyone.</p>
    </div>
  `;

  if (status.provider === 'resend') {
    const fromAddress = process.env.SMTP_FROM || 'WorkerHub <onboarding@resend.dev>';
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [params.toEmail],
        subject,
        text: textBody,
        html: htmlBody,
      }),
    });

    if (!resp.ok) {
      const errBody = await resp.text();
      throw new Error(`Email delivery failed (${resp.status}): ${errBody}`);
    }
    return;
  }

  // SMTP via nodemailer
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const transporter = process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              }
            : undefined,
      })
    : nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

  const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@workerhub.local';
  await transporter.sendMail({
    from: `WorkerHub Singapore <${fromAddress}>`,
    to: params.toEmail,
    subject,
    text: textBody,
    html: htmlBody,
  });
}
