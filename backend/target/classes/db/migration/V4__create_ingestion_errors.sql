CREATE TABLE ingestion_errors (
    id UUID PRIMARY KEY,
    ingestion_job_id UUID NOT NULL,
    row_number BIGINT NOT NULL,

    error_code VARCHAR(100) NOT NULL,
    error_message TEXT NOT NULL,

    raw_row JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL,

    CONSTRAINT fk_ingestion_errors_job
        FOREIGN KEY (ingestion_job_id)
        REFERENCES ingestion_jobs(id)
        ON DELETE CASCADE
);
