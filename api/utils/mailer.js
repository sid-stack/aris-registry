/**
 * Shared Mailer Utility — BidSmith
 *
 * Single source of truth for nodemailer transport.
 * Key fix: connectionTimeout + socketTimeout prevent SMTP hangs from
 * blocking API responses indefinitely (was the root cause of the
 * "Submitting..." form freeze when Railway couldn't reach Gmail SMTP).
 */

let _nodemailer = null;
async function getNodemailer() {
  if (!_nodemailer) _nodemailer = (await import("nodemailer")).default;
  return _nodemailer;
}

function buildTransport(nm) {
  return nm.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false,
    // ─── Critical: fail fast if SMTP is unreachable ──────────────────────
    connectionTimeout: 5_000,  // 5s to establish TCP connection
    greetingTimeout: 5_000,    // 5s for server greeting
    socketTimeout: 10_000,     // 10s idle socket timeout
    // ─────────────────────────────────────────────────────────────────────
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Send an email. Never throws — logs warn on failure and returns false.
 * Use { fatal: true } only when the caller must surface the error.
 *
 * @param {{ from?: string, to: string, subject: string, html?: string, text?: string, replyTo?: string }} opts
 * @param {{ fatal?: boolean }} flags
 * @returns {Promise<boolean>}
 */
export async function sendEmail(opts, { fatal = false } = {}) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[MAILER] SMTP_USER or SMTP_PASS not set — skipping email");
    if (fatal) throw new Error("SMTP not configured");
    return false;
  }

  const fromAddress = process.env.MAIL_FROM || process.env.SMTP_USER;
  const fromName = process.env.MAIL_FROM_NAME || "BidSmith";
  const defaultFrom = `"${fromName}" <${fromAddress}>`;
  try {
    const nm = await getNodemailer();
    const transporter = buildTransport(nm);
    await transporter.sendMail({ from: defaultFrom, ...opts });
    return true;
  } catch (err) {
    if (fatal) throw err;
    console.warn(`[MAILER] Failed (non-fatal): ${err.message}`);
    return false;
  }
}
