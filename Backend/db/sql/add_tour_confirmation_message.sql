ALTER TABLE tours
ADD COLUMN IF NOT EXISTS confirmation_message TEXT DEFAULT
'Your tour reservation was successful. Please keep this email and your booking reference for future changes or cancellation.';
