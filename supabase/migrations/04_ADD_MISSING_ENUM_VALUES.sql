-- Add missing values to existing patient_condition enum
-- This script safely adds new values without breaking existing data

DO $$
BEGIN
    -- Add 'adhd' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'adhd'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'patient_condition')
    ) THEN
        ALTER TYPE patient_condition ADD VALUE IF NOT EXISTS 'adhd';
        RAISE NOTICE 'Added adhd to patient_condition enum';
    ELSE
        RAISE NOTICE 'adhd already exists in patient_condition enum';
    END IF;

    -- Add 'communication_disorder' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'communication_disorder'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'patient_condition')
    ) THEN
        ALTER TYPE patient_condition ADD VALUE IF NOT EXISTS 'communication_disorder';
        RAISE NOTICE 'Added communication_disorder to patient_condition enum';
    ELSE
        RAISE NOTICE 'communication_disorder already exists in patient_condition enum';
    END IF;

    -- Add 'intellectual_disability' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'intellectual_disability'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'patient_condition')
    ) THEN
        ALTER TYPE patient_condition ADD VALUE IF NOT EXISTS 'intellectual_disability';
        RAISE NOTICE 'Added intellectual_disability to patient_condition enum';
    ELSE
        RAISE NOTICE 'intellectual_disability already exists in patient_condition enum';
    END IF;

    -- Add 'learning_disability' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'learning_disability'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'patient_condition')
    ) THEN
        ALTER TYPE patient_condition ADD VALUE IF NOT EXISTS 'learning_disability';
        RAISE NOTICE 'Added learning_disability to patient_condition enum';
    ELSE
        RAISE NOTICE 'learning_disability already exists in patient_condition enum';
    END IF;

    -- Add 'down_syndrome' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'down_syndrome'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'patient_condition')
    ) THEN
        ALTER TYPE patient_condition ADD VALUE IF NOT EXISTS 'down_syndrome';
        RAISE NOTICE 'Added down_syndrome to patient_condition enum';
    ELSE
        RAISE NOTICE 'down_syndrome already exists in patient_condition enum';
    END IF;

    -- Add 'cerebral_palsy' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'cerebral_palsy'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'patient_condition')
    ) THEN
        ALTER TYPE patient_condition ADD VALUE IF NOT EXISTS 'cerebral_palsy';
        RAISE NOTICE 'Added cerebral_palsy to patient_condition enum';
    ELSE
        RAISE NOTICE 'cerebral_palsy already exists in patient_condition enum';
    END IF;

    -- Add 'other' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumlabel = 'other'
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'patient_condition')
    ) THEN
        ALTER TYPE patient_condition ADD VALUE IF NOT EXISTS 'other';
        RAISE NOTICE 'Added other to patient_condition enum';
    ELSE
        RAISE NOTICE 'other already exists in patient_condition enum';
    END IF;
END $$;

-- Show all current values in patient_condition enum
SELECT 'Current patient_condition enum values:' as info;
SELECT enumlabel as value
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'patient_condition')
ORDER BY enumsortorder;
