DROP TABLE IF EXISTS bookings;

CREATE TABLE IF NOT EXISTS bookings (
    id                  SERIAL PRIMARY KEY,
    tour_id             INTEGER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    email               VARCHAR(255) NOT NULL,
    full_name           VARCHAR(255) NOT NULL,
    phone               VARCHAR(50) NOT NULL,
    participants_count  INTEGER NOT NULL CHECK (participants_count > 0),
    status              VARCHAR(20) NOT NULL DEFAULT 'confirmed'
                            CHECK (status IN ('confirmed', 'cancelled')),
    booking_reference   VARCHAR(50) UNIQUE NOT NULL,
    created_at          TIMESTAMP DEFAULT NOW(),
    UNIQUE (tour_id, email)
);
