CREATE INDEX idx_ingestion_jobs_user_created
    ON ingestion_jobs(user_id, created_at DESC);

CREATE INDEX idx_ingestion_errors_job_row
    ON ingestion_errors(ingestion_job_id, row_number);

CREATE INDEX idx_ledger_events_user_occurred
    ON ledger_events(user_id, occurred_at, id);

CREATE INDEX idx_ledger_events_ingestion_job
    ON ledger_events(ingestion_job_id);

CREATE UNIQUE INDEX uq_ledger_event_import_fingerprint
    ON ledger_events(user_id, exchange, row_fingerprint)
    WHERE row_fingerprint IS NOT NULL
      AND exchange IS NOT NULL;
