// Pexels dark trading/finance photo — valid public URL
const BANNER_URL = 'https://images.pexels.com/photos/6770610/pexels-photo-6770610.jpeg?auto=compress&cs=tinysrgb&w=800';

function captionWelcome(firstName) {
  return `
⚡ *KHAN TRADE X* ⚡
━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Institutional-Grade Signals • Powered by AI_

Welcome, *${firstName}*!

To unlock *VIP ACCESS* you must have registered your Quotex account through our official partner link.

Tap the button below to begin verification.
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔒 _Secure · Instant · Automated_`;
}

function captionAskTraderId() {
  return `
⚡ *KHAN TRADE X* ⚡
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 *TRADER ID VERIFICATION*

Send your *Quotex Trader ID* as a message.

📍 *How to find it:*
├─ Open Quotex app or website
├─ Go to Profile / Account
└─ Copy your numeric Trader ID

━━━━━━━━━━━━━━━━━━━━━━━━━━━
⬇ *Type and send your Trader ID now*`;
}

function captionPending(traderId) {
  return `
⚡ *KHAN TRADE X* ⚡
━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏳ *VERIFICATION IN PROGRESS*

📥 Trader ID: \`${traderId}\`

Your request has been forwarded to our admin team and is being reviewed.

You will be notified the moment your access is confirmed.
━━━━━━━━━━━━━━━━━━━━━━━━━━━
_Usually takes just a few minutes_`;
}

function captionSuccess(traderId) {
  return `
⚡ *KHAN TRADE X* ⚡
━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *VERIFICATION SUCCESSFUL*
🚀 *ACCESS GRANTED*

✦ Trader ID: \`${traderId}\`
✦ Status: *VERIFIED & ACTIVE*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔓 *YOUR VIP BENEFITS UNLOCKED:*

├─ 📊 Premium VIP Signals
├─ 🤖 AI-Powered Signal Bot
└─ 🕐 OTC Signals Access
━━━━━━━━━━━━━━━━━━━━━━━━━━━
⬇ *Tap below to access your channels*`;
}

function captionRejection() {
  return `
⚡ *KHAN TRADE X* ⚡
━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ *VERIFICATION FAILED*

Your Trader ID is *NOT* registered under our partner link.
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *FIX IN 3 STEPS:*

*1.* Delete your existing Quotex account
*2.* Create new account via our link ⬇
*3.* Return here and send your new Trader ID
━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

function captionAlreadyApproved(traderId) {
  return `
⚡ *KHAN TRADE X* ⚡
━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *ALREADY VERIFIED*

✦ Trader ID: \`${traderId}\`
✦ Status: *ACTIVE*

Your VIP access is live. Tap below to enter.
━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

function captionInvalidId() {
  return `
⚡ *KHAN TRADE X* ⚡
━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ *INVALID TRADER ID*

That doesn't look like a valid Trader ID.
A valid ID is a *numeric code* — e.g. \`12345678\`.

Please type and send your correct Trader ID now.
━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
}

// ── Admin notifications (sent as separate plain messages to admin) ──────────

function adminNotification(type, user, extra) {
  const tag = user.username ? `@${user.username}` : user.first_name || `User ${user.id}`;
  const id = user.id;
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  const map = {
    start: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🟢 *NEW USER STARTED BOT*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${tag}
🆔 \`${id}\`
🕐 ${ts}
━━━━━━━━━━━━━━━━━━━━━━━━━━━`,

    submitted: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━
📨 *TRADER ID SUBMITTED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${tag}
🆔 \`${id}\`
📊 Trader ID: \`${extra}\`
🕐 ${ts}
━━━━━━━━━━━━━━━━━━━━━━━━━━━`,

    approved: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ *USER APPROVED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${tag}
🆔 \`${id}\`
📊 Trader ID: \`${extra}\`
🕐 ${ts}
━━━━━━━━━━━━━━━━━━━━━━━━━━━`,

    rejected: `
━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ *USER REJECTED*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 ${tag}
🆔 \`${id}\`
📊 Trader ID: \`${extra}\`
🕐 ${ts}
━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  };

  return map[type] || '';
}

module.exports = {
  BANNER_URL,
  captionWelcome,
  captionAskTraderId,
  captionPending,
  captionSuccess,
  captionRejection,
  captionAlreadyApproved,
  captionInvalidId,
  adminNotification,
};
