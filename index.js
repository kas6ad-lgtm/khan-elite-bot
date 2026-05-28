require('dotenv').config();

const { Telegraf } = require('telegraf');
const config = require('./config');
const db = require('./db');
const { sendCleanPhoto, trackUserMessage } = require('./flow');
const {
  captionWelcome,
  captionAskTraderId,
  captionPending,
  captionSuccess,
  captionRejection,
  captionAlreadyApproved,
  captionInvalidId,
  adminNotification,
} = require('./messages');
const { kbWelcome, kbRejection, kbVipLinks, kbAdminReview, kbAdminDone, kbEmpty } = require('./keyboards');

if (!config.BOT_TOKEN) {
  console.error('ERROR: BOT_TOKEN is not set in .env');
  process.exit(1);
}

const bot = new Telegraf(config.BOT_TOKEN);

// Users currently expected to type a Trader ID
const awaitingTraderId = new Set();

// ── Helpers ────────────────────────────────────────────────────────────────

async function notifyAdmin(type, user, extra) {
  if (!config.ADMIN_CHAT_ID) return;
  try {
    const text = adminNotification(type, user, extra);
    const opts = { parse_mode: 'Markdown' };
    if (type === 'submitted' && extra) {
      opts.reply_markup = kbAdminReview(user.id, extra).reply_markup;
    }
    await bot.telegram.sendMessage(config.ADMIN_CHAT_ID, text, opts);
  } catch (err) {
    console.error('Admin notify error:', err.message);
  }
}

function isAdmin(ctx) {
  return String(ctx.from.id) === String(config.ADMIN_CHAT_ID);
}

async function silentDelete(chatId, messageId) {
  if (!chatId || !messageId) return;
  try { await bot.telegram.deleteMessage(chatId, messageId); } catch {}
}

// ── Global: track every incoming user message ──────────────────────────────
// This must run before all other handlers so userMessageId is always current.

bot.use(async (ctx, next) => {
  if (ctx.message && ctx.from) {
    await trackUserMessage(ctx.from.id, ctx.message.message_id);
  }
  return next();
});

// ── /start ─────────────────────────────────────────────────────────────────

bot.command('start', async (ctx) => {
  const { id, username, first_name } = ctx.from;
  await db.upsertUser(id, username, first_name);
  await notifyAdmin('start', ctx.from);
  // sendCleanPhoto deletes the tracked /start message + previous bot message
  await sendCleanPhoto(bot.telegram, id, captionWelcome(first_name || 'Trader'), kbWelcome());
});

// ── Callback: "I HAVE CREATED ACCOUNT" ────────────────────────────────────

bot.action('verify_account', async (ctx) => {
  await ctx.answerCbQuery();
  const { id } = ctx.from;

  if (await db.isAlreadyApproved(id)) {
    const traderId = await db.getApprovedUser(id);
    await sendCleanPhoto(bot.telegram, id, captionAlreadyApproved(traderId || '—'), kbVipLinks());
    return;
  }

  awaitingTraderId.add(id);
  await sendCleanPhoto(bot.telegram, id, captionAskTraderId(), kbEmpty());
});

// ── Callback: "TRY AGAIN" after rejection ─────────────────────────────────

bot.action('retry_verify', async (ctx) => {
  await ctx.answerCbQuery();
  const { id } = ctx.from;
  awaitingTraderId.add(id);
  await sendCleanPhoto(bot.telegram, id, captionAskTraderId(), kbEmpty());
});

// ── Callback: noop ─────────────────────────────────────────────────────────

bot.action('noop', (ctx) => ctx.answerCbQuery());

// ── Admin: APPROVE ─────────────────────────────────────────────────────────

bot.action(/^adm_ok_(\d+)_(.+)$/, async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Admin only');
  await ctx.answerCbQuery('✅ Approved');

  const targetId = parseInt(ctx.match[1]);
  const traderId = ctx.match[2];

  await db.updateAttemptStatus(targetId, 'approved');
  await db.saveApprovedUser(targetId, traderId);

  try { await ctx.editMessageReplyMarkup(kbAdminDone('✅  APPROVED').reply_markup); } catch {}

  await sendCleanPhoto(bot.telegram, targetId, captionSuccess(traderId), kbVipLinks());
  await notifyAdmin('approved', { id: targetId, username: '', first_name: 'User' }, traderId);
});

// ── Admin: REJECT ──────────────────────────────────────────────────────────

bot.action(/^adm_no_(\d+)$/, async (ctx) => {
  if (!isAdmin(ctx)) return ctx.answerCbQuery('Admin only');
  await ctx.answerCbQuery('❌ Rejected');

  const targetId = parseInt(ctx.match[1]);
  const traderId = await db.getPendingTraderId(targetId) || '—';

  await db.updateAttemptStatus(targetId, 'rejected');

  try { await ctx.editMessageReplyMarkup(kbAdminDone('❌  REJECTED').reply_markup); } catch {}

  await sendCleanPhoto(bot.telegram, targetId, captionRejection(), kbRejection());
  await notifyAdmin('rejected', { id: targetId, username: '', first_name: 'User' }, traderId);
});

// ── Trader ID text input ───────────────────────────────────────────────────

bot.on('text', async (ctx) => {
  const { id: chatId, username } = ctx.from;
  const text = (ctx.message?.text || '').trim();

  if (text.startsWith('/')) return;

  if (!awaitingTraderId.has(chatId)) {
    // Not in flow — delete stray message silently
    silentDelete(chatId, ctx.message.message_id);
    return;
  }

  // Validate: 4–15 digits only
  if (!/^\d{4,15}$/.test(text)) {
    // trackUserMessage already ran in middleware — sendCleanPhoto will delete it
    await sendCleanPhoto(bot.telegram, chatId, captionInvalidId(), kbEmpty());
    awaitingTraderId.add(chatId); // re-arm
    return;
  }

  const traderId = text;
  awaitingTraderId.delete(chatId);

  await db.logVerificationAttempt(chatId, username, traderId, 'pending');
  await notifyAdmin('submitted', ctx.from, traderId);

  // Deletes: ask-trader-id photo + user's Trader ID message
  await sendCleanPhoto(bot.telegram, chatId, captionPending(traderId), kbEmpty());
});

// ── Admin text commands ────────────────────────────────────────────────────

bot.command('approve', async (ctx) => {
  if (!isAdmin(ctx)) return;
  silentDelete(ctx.chat.id, ctx.message.message_id);

  const targetId = parseInt(ctx.message.text.split(' ')[1]);
  if (!targetId) return ctx.reply('Usage: /approve <telegram_id>');

  const traderId = await db.getPendingTraderId(targetId);
  if (!traderId) return ctx.reply(`⚠️ No pending verification for ${targetId}`);

  await db.updateAttemptStatus(targetId, 'approved');
  await db.saveApprovedUser(targetId, traderId);
  await ctx.reply(`✅ Approved ${targetId}`);
  await sendCleanPhoto(bot.telegram, targetId, captionSuccess(traderId), kbVipLinks());
});

bot.command('reject', async (ctx) => {
  if (!isAdmin(ctx)) return;
  silentDelete(ctx.chat.id, ctx.message.message_id);

  const targetId = parseInt(ctx.message.text.split(' ')[1]);
  if (!targetId) return ctx.reply('Usage: /reject <telegram_id>');

  const traderId = await db.getPendingTraderId(targetId) || '—';
  await db.updateAttemptStatus(targetId, 'rejected');
  await ctx.reply(`❌ Rejected ${targetId}`);
  await sendCleanPhoto(bot.telegram, targetId, captionRejection(), kbRejection());
});

bot.command('stats', async (ctx) => {
  if (!isAdmin(ctx)) return;
  silentDelete(ctx.chat.id, ctx.message.message_id);

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY);
  const [{ count: total }, { count: approved }, { count: pending }] = await Promise.all([
    supabase.from('bot_users').select('*', { count: 'exact', head: true }),
    supabase.from('approved_users').select('*', { count: 'exact', head: true }),
    supabase.from('verification_attempts').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  await ctx.reply(
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n📊 *KHAN TRADE X — STATS*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n👥 Total Users:     *${total || 0}*\n✅ Approved:        *${approved || 0}*\n⏳ Pending Review:  *${pending || 0}*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('broadcast', async (ctx) => {
  if (!isAdmin(ctx)) return;
  silentDelete(ctx.chat.id, ctx.message.message_id);

  const text = ctx.message.text.replace('/broadcast', '').trim();
  if (!text) return ctx.reply('Usage: /broadcast <message>');

  const { createClient } = require('@supabase/supabase-js');
  const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY);
  const { data: users } = await supabase.from('bot_users').select('telegram_id');
  if (!users?.length) return ctx.reply('No users found.');

  let sent = 0, failed = 0;
  for (const u of users) {
    try { await bot.telegram.sendMessage(u.telegram_id, text, { parse_mode: 'Markdown' }); sent++; }
    catch { failed++; }
  }
  await ctx.reply(`📢 Broadcast done — Sent: ${sent} | Failed: ${failed}`);
});

// ── Error handler ──────────────────────────────────────────────────────────

bot.catch((err) => console.error('Bot error:', err.message));
process.on('unhandledRejection', (r) => console.error('Unhandled rejection:', r));

// ── Launch ─────────────────────────────────────────────────────────────────

bot.launch().then(() => {
  console.log('✅ Khan Trade X Bot is running...');
  if (!config.ADMIN_CHAT_ID) console.warn('⚠️  ADMIN_CHAT_ID not set — admin notifications disabled');
}).catch((err) => {
  console.error('Failed to launch:', err.message);
  process.exit(1);
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
