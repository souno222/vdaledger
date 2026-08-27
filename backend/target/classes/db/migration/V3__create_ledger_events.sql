CREATE TABLE ledger_events (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    ingestion_job_id UUID,

    exchange VARCHAR(30),
    source_row_number INTEGER,
    row_fingerprint VARCHAR(64),

    event_type VARCHAR(40) NOT NULL,
    asset_symbol VARCHAR(30) NOT NULL,

    quantity NUMERIC(38, 18) NOT NULL,
    gross_value_inr NUMERIC(38, 2) NOT NULL,

    occurred_at TIMESTAMPTZ NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL,

    CONSTRAINT fk_ledger_events_user
        FOREIGN KEY (user_id)
        REFERENCES app_users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ledger_events_ingestion_job
        FOREIGN KEY (ingestion_job_id)
        REFERENCES ingestion_jobs(id)
        ON DELETE SET NULL,

    CONSTRAINT ck_ledger_events_quantity
        CHECK (quantity > 0),

    CONSTRAINT ck_ledger_events_gross_value
        CHECK (gross_value_inr > 0)
);
