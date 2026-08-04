const FROM = process.env.EMAIL_FROM || "notifications@dentassist.com";

let _resend = null;
function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  if (_resend) return _resend;
  try {
    const { Resend } = require("resend");
    _resend = new Resend(process.env.RESEND_API_KEY);
  } catch (err) {
    console.error("Resend not available:", err.message);
    _resend = null;
  }
  return _resend;
}

async function sendEmail(to, subject, html) {
  try {
    const resend = getResend();
    if (!resend) {
      console.log(`[mailer] skipped (no RESEND_API_KEY): ${subject} -> ${to}`);
      return null;
    }
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) console.error("[mailer] send error:", error);
    return data;
  } catch (err) {
    console.error("[mailer] send failed:", err.message);
    return null;
  }
}

function layout(title, bodyHtml) {
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:24px;">
    <div style="background:#0F766E;border-radius:12px 12px 0 0;padding:18px 24px;">
      <div style="color:#fff;font-size:18px;font-weight:bold;">DentAssist</div>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;color:#0f172a;">
      <div style="font-size:17px;font-weight:bold;margin-bottom:12px;">${title}</div>
      ${bodyHtml}
      <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:11px;">
        You are receiving this because you have an account with DentAssist.
        <br/>This is an automated message, please do not reply.
      </div>
    </div>
  </div></body></html>`;
}

function sendWelcomeEmail(to, name) {
  return sendEmail(
    to,
    "Welcome to DentAssist!",
    layout("Welcome, " + name + "!", `
      <p>Your patient account has been created. You can now:</p>
      <ul>
        <li>Check in as a walk-in patient</li>
        <li>Book appointments online</li>
        <li>View your records, treatments, and rewards</li>
        <li>Earn loyalty points with every visit</li>
      </ul>
      <p>Head to the clinic kiosk or the patient portal to get started.</p>`)
  );
}

function sendAccountCreatedEmail(to, name, tempPassword) {
  return sendEmail(
    to,
    "Your DentAssist patient account",
    layout("Your account is ready, " + name + "!", `
      <p>The clinic has created a patient account for you.</p>
      <p>Your temporary password is:</p>
      <div style="background:#f1f5f9;padding:12px;border-radius:8px;font-family:monospace;font-size:16px;text-align:center;">${tempPassword}</div>
      <p>Sign in with this email and password, then change your password as soon as possible.</p>`)
  );
}

function sendAppointmentConfirmationEmail(to, name, a) {
  const when = a.date ? new Date(a.date).toLocaleDateString() : "";
  return sendEmail(
    to,
    "Appointment confirmed",
    layout("Appointment confirmed, " + name + "!", `
      <p>Your appointment has been booked:</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#64748b;">Date</td><td style="padding:6px 0;"><b>${when}</b></td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Time</td><td style="padding:6px 0;"><b>${a.time || ""}</b></td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Dentist</td><td style="padding:6px 0;"><b>${a.dentist || "Assigned"}</b></td></tr>
        <tr><td style="padding:6px 0;color:#64748b;">Reason</td><td style="padding:6px 0;"><b>${a.reason || "—"}</b></td></tr>
      </table>
      <p>Arrive 10 minutes early. See you soon!</p>`)
  );
}

function sendAppointmentUpdateEmail(to, name, { subject, message }) {
  return sendEmail(to, subject, layout(subject + ", " + name + "!", `<p>${message}</p>`));
}

function sendVisitCompletedEmail(to, name, { points, badges = [] } = {}) {
  const badgeHtml = badges.length
    ? `<p style="margin-top:12px;">You also earned:</p><ul>${badges.map((b) => `<li>${b.name} badge (+${b.points} pts)</li>`).join("")}</ul>`
    : "";
  return sendEmail(
    to,
    "Visit complete — points earned!",
    layout("Great visit, " + name + "!", `
      <p>Thank you for visiting DentAssist!</p>
      <div style="background:#0F766E;color:#fff;padding:14px;border-radius:10px;text-align:center;font-size:20px;font-weight:bold;">
        +${points} loyalty points
      </div>
      ${badgeHtml}
      <p style="margin-top:12px;">Check your rewards on the clinic kiosk to see your rank and perks.</p>`)
  );
}

function sendBadgeEmail(to, name, badgeName, points) {
  return sendEmail(
    to,
    "You earned a new badge!",
    layout("Badge unlocked, " + name + "!", `
      <p>Congratulations! You earned the <b>"${badgeName}"</b> badge and gained <b>+${points} loyalty points</b>.</p>
      <p>Keep visiting to unlock more rewards and climb the ranks.</p>`)
  );
}

function sendPaymentReceiptEmail(to, name, { amount, method, date, items = [] } = {}) {
  const rows = items.length
    ? items.map((i) => `<tr><td style="padding:6px 0;color:#334155;">${i.name}</td><td style="padding:6px 0;text-align:right;">${i.amount ? "₱" + i.amount.toLocaleString() : "FREE"}</td></tr>`).join("")
    : "";
  return sendEmail(
    to,
    "Payment receipt",
    layout("Receipt, " + name + "!", `
      <p>Payment received — thank you!</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${rows}
        <tr><td style="padding:8px 0 4px;font-weight:bold;">Total</td><td style="padding:8px 0 4px;text-align:right;font-weight:bold;">₱${Number(amount).toLocaleString()}</td></tr>
      </table>
      <p style="margin-top:12px;color:#64748b;">Method: ${method} · ${date || ""}</p>`)
  );
}

function sendPasswordResetEmail(to, name, link) {
  return sendEmail(
    to,
    "Reset your DentAssist password",
    layout("Reset your password, " + name + "!", `
      <p>We received a request to reset your DentAssist password. Click the button below — the link expires in 15 minutes.</p>
      <p style="text-align:center;margin:20px 0;">
        <a href="${link}" style="background:#0F766E;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:bold;">
          Click here to reset your password
        </a>
      </p>
      <p>If you didn't request this, you can safely ignore this email.</p>`)
  );
}

module.exports = {
  sendWelcomeEmail,
  sendAccountCreatedEmail,
  sendAppointmentConfirmationEmail,
  sendAppointmentUpdateEmail,
  sendVisitCompletedEmail,
  sendBadgeEmail,
  sendPaymentReceiptEmail,
  sendPasswordResetEmail,
};
