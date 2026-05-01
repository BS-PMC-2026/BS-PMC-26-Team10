DROP TABLE IF EXISTS tours;

CREATE TABLE IF NOT EXISTS tours (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(255) NOT NULL,
    kind          VARCHAR(50)  NOT NULL DEFAULT 'field-tasting',
    description   TEXT         DEFAULT '',
    date          DATE         NOT NULL,
    time          TIME         NOT NULL,
    duration      VARCHAR(50)  DEFAULT '90 min',
    capacity      INTEGER      NOT NULL CHECK (capacity > 0),
    price         NUMERIC(10,2) DEFAULT 0,
    meeting_point VARCHAR(255) DEFAULT '',
    includes      TEXT         DEFAULT '',
    accessibility VARCHAR(50)  DEFAULT 'mostly-yes',
    visibility    VARCHAR(20)  DEFAULT 'draft',
    created_at    TIMESTAMP    DEFAULT NOW()
);
