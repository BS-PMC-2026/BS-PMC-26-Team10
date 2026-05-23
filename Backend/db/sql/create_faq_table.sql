CREATE TABLE IF NOT EXISTS faq (
  id BIGSERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL
);

ALTER TABLE faq ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Tours';
ALTER TABLE faq ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE faq ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE faq ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'faq_question_unique'
  ) THEN
    ALTER TABLE faq ADD CONSTRAINT faq_question_unique UNIQUE (question);
  END IF;
END $$;

ALTER TABLE faq ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access to active FAQ" ON faq;

CREATE POLICY "Allow public read access to active FAQ"
ON faq
FOR SELECT
USING (is_active = TRUE);

INSERT INTO faq (question, answer, category, display_order, is_active)
VALUES
  ('How do I book a tour?', 'Open the Tours page, choose an available tour, fill in your details, select the number of participants, and complete the payment. After the booking is saved, you will receive a booking reference and a confirmation email.', 'Booking', 1, TRUE),
  ('Can I cancel my booking?', 'Yes. You can cancel your booking as long as the tour has not started yet. Open the Tours page, choose the tour you booked, and click the "Cancel a booking" button on the tour details page. For questions about payment refunds, please contact the farm directly.', 'Cancellation', 2, TRUE),
  ('Where do the tours take place?', 'Tours take place at the ChiliLand visitor center in Moshav Prigan, where visitors can experience a working hot pepper farm.', 'Visit', 3, TRUE),
  ('What can visitors expect during the tour?', 'Visitors can learn about hot pepper varieties, greenhouse growing, spicy products, and may take part in tastings depending on the selected tour.', 'Visit', 4, TRUE),
  ('Are the tastings very spicy?', 'Some tastings may be spicy, but visitors can choose what they feel comfortable trying. The experience is suitable for both spicy-food fans and curious beginners.', 'Visit', 5, TRUE),
  ('Are tours suitable for groups?', 'Yes. Tours can support groups depending on the capacity of the selected tour. The real visitor center experience is designed for groups as well.', 'Visit', 6, TRUE),
  ('What should I bring?', 'Comfortable shoes, water, and weather-appropriate clothing are recommended, especially for greenhouse visits.', 'Visit', 7, TRUE)
ON CONFLICT (question) DO UPDATE
SET answer = EXCLUDED.answer,
    category = EXCLUDED.category,
    display_order = EXCLUDED.display_order,
    is_active = EXCLUDED.is_active;

UPDATE faq
SET is_active = FALSE
WHERE question IN (
  'How will I know my booking was successful?',
  'Can I open a full tour if I only want to cancel my booking?'
);
