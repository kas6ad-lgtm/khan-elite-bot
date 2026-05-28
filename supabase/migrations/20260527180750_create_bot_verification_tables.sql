/*
  # Khan Trade X Bot - Verification Tables

  ## Overview
  Creates tables to track:
  1. All user interactions with the bot
  2. Verification attempts (pass/fail)
  3. Approved users who have been granted access

  ## New Tables

  ### `bot_users`
  Tracks every user who interacts with the bot.
  - `id` - Primary key
  - `telegram_id` - Unique Telegram user ID
  - `username` - Telegram username (nullable)
  - `first_name` - User's first name
  - `language` - Selected language (default: 'en')
  - `created_at` - First interaction timestamp

  ### `verification_attempts`
  Logs every trader ID verification attempt.
  - `id` - Primary key
  - `telegram_id` - Telegram user ID
  - `username` - Telegram username at time of attempt
  - `trader_id` - The Quotex Trader ID submitted
  - `status` - 'pending' | 'approved' | 'rejected'
  - `created_at` - Timestamp of attempt

  ### `approved_users`
  Tracks users who have passed verification.
  - `id` - Primary key
  - `telegram_id` - Telegram user ID (unique)
  - `trader_id` - Verified Quotex Trader ID
  - `approved_at` - Timestamp of approval

  ## Security
  - RLS enabled on all tables
  - Service role has full access for bot operations
*/

CREATE TABLE IF NOT EXISTS bot_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint UNIQUE NOT NULL,
  username text DEFAULT '',
  first_name text DEFAULT '',
  language text DEFAULT 'en',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bot_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage bot_users"
  ON bot_users FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert bot_users"
  ON bot_users FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update bot_users"
  ON bot_users FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS verification_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint NOT NULL,
  username text DEFAULT '',
  trader_id text NOT NULL,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE verification_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can select verification_attempts"
  ON verification_attempts FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert verification_attempts"
  ON verification_attempts FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update verification_attempts"
  ON verification_attempts FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS approved_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id bigint UNIQUE NOT NULL,
  trader_id text NOT NULL,
  approved_at timestamptz DEFAULT now()
);

ALTER TABLE approved_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can select approved_users"
  ON approved_users FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can insert approved_users"
  ON approved_users FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_verification_attempts_telegram_id ON verification_attempts(telegram_id);
CREATE INDEX IF NOT EXISTS idx_approved_users_telegram_id ON approved_users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_approved_users_trader_id ON approved_users(trader_id);
