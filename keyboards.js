const { Markup } = require('telegraf');
const config = require('./config');

const kbWelcome = () => Markup.inlineKeyboard([
  [Markup.button.callback('✅   I HAVE CREATED ACCOUNT', 'verify_account')],
]);

const kbRejection = () => Markup.inlineKeyboard([
  [Markup.button.url('🔗   CREATE NEW ACCOUNT', config.AFFILIATE_LINK)],
  [Markup.button.callback('🔄   TRY AGAIN WITH NEW ID', 'retry_verify')],
]);

const kbVipLinks = () => Markup.inlineKeyboard([
  [Markup.button.url('📊   VIP Signals Channel', config.VIP_CHANNEL_LINK)],
  [Markup.button.url('🤖   AI Signal Bot', config.AI_BOT_LINK)],
  [Markup.button.url('🕐   OTC Signals Channel', config.OTC_SIGNAL_LINK)],
]);

const kbAdminReview = (telegramId, traderId) => Markup.inlineKeyboard([
  [
    Markup.button.callback('✅  APPROVE', `adm_ok_${telegramId}_${traderId}`),
    Markup.button.callback('❌  REJECT',  `adm_no_${telegramId}`),
  ],
]);

const kbAdminDone = (label) => Markup.inlineKeyboard([
  [Markup.button.callback(label, 'noop')],
]);

const kbEmpty = () => ({ reply_markup: { inline_keyboard: [] } });

module.exports = { kbWelcome, kbRejection, kbVipLinks, kbAdminReview, kbAdminDone, kbEmpty };
