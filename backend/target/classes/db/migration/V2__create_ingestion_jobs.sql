CREATE TABLE ingestion_jobs (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    exchange VARCHAR(30) NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    status VARCHAR(40) NOT NULL,

    total_rows INTEGER NOT NULL DEFAULT 0,
    imported_rows INTEGER NOT NULL DEFAULT 0,
    failed_rows INTEGER NOT NULL DEFAULT 0,
    duplicate_rows INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,

    CONSTRAINT fk_ingestion_jobs_user
        FOREIGN KEY (user_id)
        REFERENCES app_users(id)
        ON DELETE CASCADE,

    CONSTRAINT ck_ingestion_jobs_counts
        CHECK (
            total_rows >= 0
            AND imported_rows >= 0
            AND failed_rows >= 0
            AND duplicate_rows >= 0
        )
);
