require('dotenv').config();

module.exports = {
  BOT_TOKEN: process.env.BOT_TOKEN || '',
  ADMIN_CHAT_ID: process.env.ADMIN_CHAT_ID || '',
  AFFILIATE_LINK: process.env.AFFILIATE_LINK || 'https://broker-qx.pro/sign-up/?lid=1380045',

  VIP_CHANNEL_LINK: process.env.VIP_CHANNEL_LINK || 'https://t.me/khantradex_vip',
  AI_BOT_LINK: process.env.AI_BOT_LINK || 'https://t.me/khantradex_ai',
  OTC_SIGNAL_LINK: process.env.OTC_SIGNAL_LINK || 'https://t.me/khantradex_otc',

  SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY,
};
