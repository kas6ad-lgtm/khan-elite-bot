/*
  # Add active_message_id to bot_users

  Stores the Telegram message_id of the single active bot message per user.
  This persists across bot restarts so editMessageCaption always has the correct ID.

  ## Changes
  - `bot_users`: add `active_message_id` (bigint, nullable)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_users' AND column_name = 'active_message_id'
  ) THEN
    ALTER TABLE bot_users ADD COLUMN active_message_id bigint DEFAULT NULL;
  END IF;
END $$;
