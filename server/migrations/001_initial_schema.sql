-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alias_status') THEN
        CREATE TYPE alias_status AS ENUM ('active', 'paused', 'deleted');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'alias_type') THEN
        CREATE TYPE alias_type AS ENUM ('random', 'custom', 'temporary');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'email_status') THEN
        CREATE TYPE email_status AS ENUM ('forwarded', 'bounced', 'rejected', 'pending');
    END IF;
END
$$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Aliases table
CREATE TABLE IF NOT EXISTS aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    address VARCHAR(255) UNIQUE NOT NULL,
    status alias_status NOT NULL DEFAULT 'active',
    alias_type alias_type NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aliases_user_id ON aliases(user_id);
CREATE INDEX IF NOT EXISTS idx_aliases_address ON aliases(address);
CREATE INDEX IF NOT EXISTS idx_aliases_status ON aliases(status);

-- Target emails table
CREATE TABLE IF NOT EXISTS target_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    verification_token VARCHAR(255),
    verification_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_target_emails_user_id ON target_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_target_emails_verification_token ON target_emails(verification_token);

-- Email logs table
CREATE TABLE IF NOT EXISTS email_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alias_id UUID NOT NULL REFERENCES aliases(id) ON DELETE CASCADE,
    from_email VARCHAR(255) NOT NULL,
    subject TEXT,
    status email_status NOT NULL DEFAULT 'pending',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_alias_id ON email_logs(alias_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at'
    ) THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_aliases_updated_at'
    ) THEN
        CREATE TRIGGER update_aliases_updated_at BEFORE UPDATE ON aliases
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_target_emails_updated_at'
    ) THEN
        CREATE TRIGGER update_target_emails_updated_at BEFORE UPDATE ON target_emails
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

