-- Database initialization script
-- This script runs when the PostgreSQL container starts for the first time

-- Create the database if it doesn't exist
SELECT 'CREATE DATABASE campsite_db'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'campsite_db')\gexec

-- Create user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_user WHERE usename = 'campsite_user') THEN
        CREATE USER campsite_user WITH PASSWORD 'campsite_password';
    END IF;
END
$$;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE campsite_db TO campsite_user;

-- Connect to the database
\c campsite_db

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO campsite_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO campsite_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO campsite_user;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a basic health check function
CREATE OR REPLACE FUNCTION health_check()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Database is healthy';
END;
$$ LANGUAGE plpgsql;
