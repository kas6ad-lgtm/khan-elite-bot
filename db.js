const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY);

// ── bot_users ──────────────────────────────────────────────────────────────

async function upsertUser(telegramId, username, firstName) {
  const { error } = await supabase
    .from('bot_users')
    .upsert(
      { telegram_id: telegramId, username: username || '', first_name: firstName || '' },
      { onConflict: 'telegram_id', ignoreDuplicates: false }
    );
  if (error) console.error('upsertUser:', error.message);
}

async function getMessageIds(telegramId) {
  const { data } = await supabase
    .from('bot_users')
    .select('active_message_id, last_user_message_id')
    .eq('telegram_id', telegramId)
    .maybeSingle();
  return {
    botMsgId: data?.active_message_id || null,
    userMsgId: data?.last_user_message_id || null,
  };
}

async function saveBotMessageId(telegramId, messageId) {
  const { error } = await supabase
    .from('bot_users')
    .update({ active_message_id: messageId })
    .eq('telegram_id', telegramId);
  if (error) console.error('saveBotMessageId:', error.message);
}

async function saveUserMessageId(telegramId, messageId) {
  const { error } = await supabase
    .from('bot_users')
    .update({ last_user_message_id: messageId })
    .eq('telegram_id', telegramId);
  if (error) console.error('saveUserMessageId:', error.message);
}

async function clearMessageIds(telegramId) {
  const { error } = await supabase
    .from('bot_users')
    .update({ active_message_id: null, last_user_message_id: null })
    .eq('telegram_id', telegramId);
  if (error) console.error('clearMessageIds:', error.message);
}

// ── verification_attempts ──────────────────────────────────────────────────

async function logVerificationAttempt(telegramId, username, traderId, status) {
  const { error } = await supabase
    .from('verification_attempts')
    .insert({ telegram_id: telegramId, username: username || '', trader_id: traderId, status });
  if (error) console.error('logVerificationAttempt:', error.message);
}

async function updateAttemptStatus(telegramId, status) {
  const { data: row } = await supabase
    .from('verification_attempts')
    .select('id')
    .eq('telegram_id', telegramId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row) return;
  await supabase.from('verification_attempts').update({ status }).eq('id', row.id);
}

async function getPendingTraderId(telegramId) {
  const { data } = await supabase
    .from('verification_attempts')
    .select('trader_id')
    .eq('telegram_id', telegramId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.trader_id || null;
}

// ── approved_users ─────────────────────────────────────────────────────────

async function saveApprovedUser(telegramId, traderId) {
  const { error } = await supabase
    .from('approved_users')
    .upsert({ telegram_id: telegramId, trader_id: traderId }, { onConflict: 'telegram_id' });
  if (error) console.error('saveApprovedUser:', error.message);
}

async function isAlreadyApproved(telegramId) {
  const { data } = await supabase
    .from('approved_users')
    .select('id')
    .eq('telegram_id', telegramId)
    .maybeSingle();
  return !!data;
}

async function getApprovedUser(telegramId) {
  const { data } = await supabase
    .from('approved_users')
    .select('trader_id')
    .eq('telegram_id', telegramId)
    .maybeSingle();
  return data?.trader_id || null;
}

module.exports = {
  upsertUser,
  getMessageIds,
  saveBotMessageId,
  saveUserMessageId,
  clearMessageIds,
  logVerificationAttempt,
  updateAttemptStatus,
  getPendingTraderId,
  saveApprovedUser,
  isAlreadyApproved,
  getApprovedUser,
};
