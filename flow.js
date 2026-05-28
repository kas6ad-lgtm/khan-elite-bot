/**
 * Wizard-step engine with in-memory message tracking.
 *
 * userMessages[chatId] = { botMessageId, userMessageId }
 *
 * In-memory map is the primary delete source (instant, no DB latency).
 * Supabase is used to restore IDs after a bot restart.
 */

const db = require('./db');
const { BANNER_URL } = require('./messages');

// In-memory store: chatId → { botMessageId, userMessageId }
const userMessages = {};

// ── Restore from DB on first access ───────────────────────────────────────

async function ensureLoaded(chatId) {
  if (userMessages[chatId]) return;
  const { botMsgId, userMsgId } = await db.getMessageIds(chatId);
  userMessages[chatId] = {
    botMessageId: botMsgId || null,
    userMessageId: userMsgId || null,
  };
}

// ── Track incoming user message ────────────────────────────────────────────

async function trackUserMessage(chatId, messageId) {
  if (!userMessages[chatId]) userMessages[chatId] = {};
  userMessages[chatId].userMessageId = messageId;
  await db.saveUserMessageId(chatId, messageId);
}

// ── Core delete + send photo ───────────────────────────────────────────────

async function sendCleanPhoto(telegram, chatId, caption, keyboard) {
  await ensureLoaded(chatId);

  const { botMessageId, userMessageId } = userMessages[chatId] || {};

  // Delete previous bot message
  if (botMessageId) {
    try { await telegram.deleteMessage(chatId, botMessageId); } catch {}
  }
  // Delete previous user message
  if (userMessageId) {
    try { await telegram.deleteMessage(chatId, userMessageId); } catch {}
  }

  // Clear immediately before send (prevents double-delete on race)
  userMessages[chatId] = { botMessageId: null, userMessageId: null };
  await db.clearMessageIds(chatId);

  // Send fresh photo — image above caption, keyboard attached
  const msg = await telegram.sendPhoto(chatId, BANNER_URL, {
    caption,
    parse_mode: 'Markdown',
    reply_markup: keyboard?.reply_markup ?? { inline_keyboard: [] },
  });

  // Save new bot message ID
  userMessages[chatId].botMessageId = msg.message_id;
  await db.saveBotMessageId(chatId, msg.message_id);

  return msg;
}

module.exports = { sendCleanPhoto, trackUserMessage };
