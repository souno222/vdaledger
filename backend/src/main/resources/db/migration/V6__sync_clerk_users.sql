ALTER TABLE app_users
    ADD COLUMN first_name VARCHAR(255),
    ADD COLUMN last_name VARCHAR(255),
    ADD COLUMN image_url TEXT,
    ADD COLUMN clerk_created_at TIMESTAMPTZ,
    ADD COLUMN clerk_updated_at TIMESTAMPTZ,
    ADD COLUMN clerk_synced_at TIMESTAMPTZ,
    ADD COLUMN clerk_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN deleted_at TIMESTAMPTZ;

CREATE TABLE clerk_webhook_deliveries (
    svix_id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    clerk_user_id VARCHAR(128),
    received_at TIMESTAMPTZ NOT NULL,
    processed_at TIMESTAMPTZ
);

CREATE INDEX idx_clerk_webhook_deliveries_received_at
    ON clerk_webhook_deliveries (received_at DESC);
