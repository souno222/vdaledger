CREATE TABLE app_users (
    id UUID PRIMARY KEY,
    clerk_user_id VARCHAR(128) NOT NULL,
    email VARCHAR(320),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,

    CONSTRAINT uq_app_users_clerk_user_id
        UNIQUE (clerk_user_id)
);
