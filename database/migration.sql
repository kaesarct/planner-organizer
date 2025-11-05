-- Migration to allow NULL assigned_to
ALTER TABLE tasks ALTER COLUMN assigned_to DROP NOT NULL;