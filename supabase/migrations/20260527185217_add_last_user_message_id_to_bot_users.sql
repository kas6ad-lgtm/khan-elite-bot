/*
  # Add last_user_message_id to bot_users

  Tracks the most recent message_id sent by the user so it can be
  deleted before showing the next verification step.

  ## Changes
  - `bot_users`: add `last_user_message_id` (bigint, nullable)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bot_users' AND column_name = 'last_user_message_id'
  ) THEN
    ALTER TABLE bot_users ADD COLUMN last_user_message_id bigint DEFAULT NULL;
  END IF;
END $$;
