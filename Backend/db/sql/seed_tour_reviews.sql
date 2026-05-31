-- Seed test reviews for the two most recent past tours.
-- Run this in the Supabase SQL Editor AFTER running create_tour_reviews_table.sql.

DO $$
DECLARE
    tid1    INTEGER;
    ttitle1 TEXT;
    tid2    INTEGER;
    ttitle2 TEXT;
BEGIN
    SELECT id, title INTO tid1, ttitle1
        FROM tours WHERE date < CURRENT_DATE ORDER BY date DESC LIMIT 1;

    SELECT id, title INTO tid2, ttitle2
        FROM tours WHERE date < CURRENT_DATE AND id <> tid1
        ORDER BY date DESC LIMIT 1;

    IF tid1 IS NOT NULL THEN
        INSERT INTO tour_reviews
            (tour_id, tour_title, booking_reference, reviewer_name, rating, comment, photo_url, created_at)
        VALUES
            (tid1, ttitle1, 'SEED0001', 'Sarah M.', 5,
             'Absolutely incredible experience! The spice levels were explained perfectly and we got to taste so many amazing chili varieties. Will definitely come back next season!',
             'https://i.pravatar.cc/80?img=5',
             NOW() - INTERVAL '3 days'),
            (tid1, ttitle1, 'SEED0002', 'David K.', 4,
             'Great tour, very informative. The guide was passionate and knowledgeable about every chili variety. Loved the greenhouse walk — it feels magical inside.',
             '',
             NOW() - INTERVAL '5 days'),
            (tid1, ttitle1, 'SEED0003', 'Rachel T.', 5,
             'The highlight of our whole trip! The tastings were a real adventure and the farm setting is just beautiful. Highly recommend to anyone who loves good food!',
             'https://i.pravatar.cc/80?img=25',
             NOW() - INTERVAL '1 day');
    END IF;

    IF tid2 IS NOT NULL THEN
        INSERT INTO tour_reviews
            (tour_id, tour_title, booking_reference, reviewer_name, rating, comment, photo_url, created_at)
        VALUES
            (tid2, ttitle2, 'SEED0004', 'James R.', 4,
             'Well organized and very fun. My whole family enjoyed it — the kids were especially excited about picking chilies straight from the plants!',
             '',
             NOW() - INTERVAL '8 days'),
            (tid2, ttitle2, 'SEED0005', 'Mia S.', 5,
             'An unforgettable farm experience. Fresh air, wonderful hosts and the spiciest adventure I''ve ever had. Cannot recommend enough!',
             'https://i.pravatar.cc/80?img=47',
             NOW() - INTERVAL '6 days'),
            (tid2, ttitle2, 'SEED0006', 'Tom B.', 3,
             'Nice experience overall. The farm is gorgeous and the staff were very friendly. Would love even more tasting variety next time, but a solid outing!',
             '',
             NOW() - INTERVAL '2 days');
    END IF;
END $$;
