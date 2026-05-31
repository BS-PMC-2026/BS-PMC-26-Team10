CREATE TABLE IF NOT EXISTS tour_reviews (
    id          SERIAL PRIMARY KEY,
    tour_id     INTEGER NOT NULL,
    tour_title  VARCHAR(255) NOT NULL DEFAULT '',
    booking_reference VARCHAR(50) NOT NULL,
    reviewer_name     VARCHAR(255) NOT NULL,
    rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment     TEXT DEFAULT '',
    photo_url   TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (booking_reference)
);
