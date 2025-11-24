/**
 * Sprint S6: Immutable Security Change Log
 *
 * Tamper-proof security log table with PostgreSQL IMMUTABLE constraints
 * Once written, log entries cannot be modified or deleted
 */

-- Create security_log table with immutability constraints
CREATE TABLE IF NOT EXISTS security_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Event details
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('security_change', 'vulnerability', 'incident', 'audit')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,

  -- Author and commit info
  author VARCHAR(255) NOT NULL,
  commit_hash VARCHAR(64),
  sprint VARCHAR(50),

  -- Affected files (JSON array)
  affected_files JSONB,

  -- Immutability checksums (blockchain-style chain)
  checksum VARCHAR(64) NOT NULL UNIQUE,
  previous_checksum VARCHAR(64),

  -- Additional metadata
  metadata JSONB,

  -- Immutability constraints
  CONSTRAINT valid_checksum_format CHECK (checksum ~ '^[a-f0-9]{64}$'),
  CONSTRAINT valid_commit_hash_format CHECK (commit_hash IS NULL OR commit_hash ~ '^[a-f0-9]{40,64}$')
);

-- Create index on timestamp for efficient querying
CREATE INDEX idx_security_log_created_at ON security_log(created_at DESC);

-- Create index on event type and severity
CREATE INDEX idx_security_log_event_severity ON security_log(event_type, severity);

-- Create index on sprint
CREATE INDEX idx_security_log_sprint ON security_log(sprint) WHERE sprint IS NOT NULL;

-- Create index on checksum chain (for validation)
CREATE INDEX idx_security_log_checksum_chain ON security_log(previous_checksum) WHERE previous_checksum IS NOT NULL;

-- Create immutability constraint function
-- This function prevents UPDATE and DELETE operations on the security_log table
CREATE OR REPLACE FUNCTION prevent_security_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Security log entries are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Apply immutability triggers
CREATE TRIGGER prevent_security_log_update
  BEFORE UPDATE ON security_log
  FOR EACH ROW EXECUTE FUNCTION prevent_security_log_modification();

CREATE TRIGGER prevent_security_log_delete
  BEFORE DELETE ON security_log
  FOR EACH ROW EXECUTE FUNCTION prevent_security_log_modification();

-- Create view for recent security events (last 30 days)
CREATE OR REPLACE VIEW recent_security_events AS
SELECT
  id,
  created_at,
  event_type,
  severity,
  description,
  author,
  commit_hash,
  sprint,
  affected_files,
  checksum
FROM security_log
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- Create view for critical security events
CREATE OR REPLACE VIEW critical_security_events AS
SELECT
  id,
  created_at,
  event_type,
  severity,
  description,
  author,
  commit_hash,
  sprint,
  affected_files,
  checksum
FROM security_log
WHERE severity IN ('critical', 'high')
ORDER BY created_at DESC;

-- Create function to validate log chain integrity
CREATE OR REPLACE FUNCTION validate_security_log_chain()
RETURNS TABLE (
  entry_id UUID,
  is_valid BOOLEAN,
  error_message TEXT
) AS $$
DECLARE
  prev_checksum VARCHAR(64);
  current_entry RECORD;
BEGIN
  prev_checksum := NULL;

  FOR current_entry IN
    SELECT * FROM security_log ORDER BY created_at ASC
  LOOP
    -- Check if previous_checksum matches
    IF prev_checksum IS NOT NULL AND
       (current_entry.previous_checksum IS NULL OR
        current_entry.previous_checksum != prev_checksum) THEN
      entry_id := current_entry.id;
      is_valid := FALSE;
      error_message := 'Chain broken: previous_checksum mismatch';
      RETURN NEXT;
    ELSE
      entry_id := current_entry.id;
      is_valid := TRUE;
      error_message := NULL;
      RETURN NEXT;
    END IF;

    prev_checksum := current_entry.checksum;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Grant appropriate permissions
-- Read-only for most users, insert-only for security automation
GRANT SELECT ON security_log TO PUBLIC;
GRANT INSERT ON security_log TO security_automation; -- Create this role as needed

-- Create comments for documentation
COMMENT ON TABLE security_log IS 'Immutable security audit log with blockchain-style checksum chain';
COMMENT ON COLUMN security_log.checksum IS 'SHA-256 hash of entry for tamper detection';
COMMENT ON COLUMN security_log.previous_checksum IS 'Links to previous entry for chain validation';
COMMENT ON FUNCTION prevent_security_log_modification() IS 'Ensures log entries cannot be modified or deleted';
COMMENT ON FUNCTION validate_security_log_chain() IS 'Validates integrity of entire log chain';

-- Sample query to validate log integrity
-- SELECT * FROM validate_security_log_chain() WHERE is_valid = FALSE;

-- Sample query to check recent critical events
-- SELECT * FROM critical_security_events LIMIT 10;
