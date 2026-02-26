import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'OHPC Kindergarten <onboarding@resend.dev>';

export async function sendVerificationEmail(to, { firstName, verifyUrl }) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Verify your email address — OHPC Kindergarten',
    text: `Hi ${firstName},\n\nPlease verify your email address by visiting the link below:\n\n${verifyUrl}\n\nThis link expires in 24 hours.\n\nIf you did not register an account, you can safely ignore this email.\n\n— OHPC Kindergarten Team`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:#1E3A5F;padding:24px;border-radius:8px 8px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:20px">OHPC Kindergarten Progress Checklist</h1>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:32px;border-radius:0 0 8px 8px">
          <p style="margin:0 0 16px;color:#374151">Hi ${firstName},</p>
          <p style="margin:0 0 24px;color:#374151">Please verify your email address to activate your account.</p>
          <a href="${verifyUrl}"
             style="display:inline-block;background:#7CB342;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px">
            Verify Email Address
          </a>
          <p style="margin:24px 0 0;color:#9ca3af;font-size:14px">
            This link expires in 24 hours. If you did not register, you can safely ignore this email.
          </p>
          <p style="margin:8px 0 0;color:#9ca3af;font-size:13px">
            Or copy and paste this URL: <a href="${verifyUrl}" style="color:#1E3A5F">${verifyUrl}</a>
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to, { firstName, resetUrl }) {
  return resend.emails.send({
    from: FROM,
    to,
    subject: 'Reset your password — OHPC Kindergarten',
    text: `Hi ${firstName},\n\nYou requested a password reset. Visit the link below to set a new password:\n\n${resetUrl}\n\nThis link expires in 1 hour.\n\nIf you did not request a password reset, you can safely ignore this email.\n\n— OHPC Kindergarten Team`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:#1E3A5F;padding:24px;border-radius:8px 8px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:20px">OHPC Kindergarten Progress Checklist</h1>
        </div>
        <div style="background:#fff;border:1px solid #e5e7eb;border-top:none;padding:32px;border-radius:0 0 8px 8px">
          <p style="margin:0 0 16px;color:#374151">Hi ${firstName},</p>
          <p style="margin:0 0 24px;color:#374151">You requested a password reset for your account. Click the button below to set a new password.</p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#7CB342;color:#fff;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:16px">
            Reset Password
          </a>
          <p style="margin:24px 0 0;color:#9ca3af;font-size:14px">
            This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.
          </p>
          <p style="margin:8px 0 0;color:#9ca3af;font-size:13px">
            Or copy and paste this URL: <a href="${resetUrl}" style="color:#1E3A5F">${resetUrl}</a>
          </p>
        </div>
      </div>
    `,
  });
}
