# Data Corruption Playbook

**Severity**: High (P1)  
**Response Time**: < 30 minutes  
**Owner**: Data Team  
**Last Updated**: 2025-11-14

## Symptoms

- Inconsistent data across systems
- Failed data integrity checks
- Foreign key constraint violations
- Duplicate records where uniqueness expected
- Missing or NULL values in required fields
- Checksum mismatches

## Immediate Actions

### 1. Stop Data Modifications

```bash
# Switch database to read-only mode
psql -c "ALTER DATABASE political_sphere SET default_transaction_read_only = true;"

# Disable background jobs
kubectl scale deployment/worker -n production --replicas=0

# Pause API writes (feature flag)
kubectl set env deployment/api -n production FEATURE_FLAG_DISABLE_WRITES=true

# Notify users
curl -X POST https://api.political-sphere.com/admin/maintenance-mode \
  -H "Authorization: Bearer <admin-token>" \
  -d '{"enabled": true, "message": "Investigating data issue"}'
```

### 2. Assess Corruption Scope

```bash
# Run data integrity checks
psql -f scripts/data-integrity-check.sql

# Check referential integrity
psql -c "SELECT * FROM pg_constraint WHERE contype = 'f' AND NOT convalidated;"

# Identify affected tables
psql -c "SELECT tablename FROM pg_tables WHERE schemaname='public';" | while read table; do
  echo "Checking $table..."
  psql -c "SELECT count(*) FROM $table WHERE <corruption-condition>;"
done

# Check for duplicates
psql -c "SELECT column_name, COUNT(*) FROM table_name GROUP BY column_name HAVING COUNT(*) > 1;"
```

### 3. Identify When Corruption Occurred

```bash
# Check audit logs
psql -c "SELECT * FROM audit_log WHERE created_at >= '<suspected-time>' ORDER BY created_at DESC LIMIT 100;"

# Review recent deployments
kubectl rollout history deployment/api -n production

# Check recent database migrations
psql -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 10;"

# Review backup timestamps
aws s3 ls s3://backups/database/ --recursive | grep $(date +%Y-%m-%d)
```

## Common Scenarios

### Scenario 1: Failed Migration Caused Corruption

**Symptoms**:
- Corruption started after database migration
- Schema inconsistencies

**Resolution**:
```bash
# Rollback migration
psql -c "DELETE FROM schema_migrations WHERE version='<bad-migration-version>';"

# Run rollback script
psql -f migrations/<version>_down.sql

# Verify schema
psql -c "\d+ <affected-table>"

# If rollback fails, restore from pre-migration backup
pg_restore -d political_sphere /backup/pre_migration_$(date +%Y%m%d).dump

# Replay transactions after backup (if possible)
pg_wal_replay --start-lsn <backup-lsn> --end-lsn <current-lsn>
```

### Scenario 2: Race Condition Created Duplicates

**Symptoms**:
- Duplicate records in unique columns
- Constraint violations

**Resolution**:
```bash
# Identify duplicates
psql -c "SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1;"

# Merge duplicates (preserve newest)
psql <<EOF
WITH duplicates AS (
  SELECT id, email, ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM users
)
DELETE FROM users WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);
EOF

# Add unique constraint to prevent recurrence
psql -c "ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);"

# Fix application code race condition
git checkout hotfix/fix-race-condition
./scripts/emergency-deploy.sh
```

### Scenario 3: Bulk Update Corrupted Data

**Symptoms**:
- Mass data changes
- Unexpected NULL or incorrect values

**Resolution**:
```bash
# Identify affected rows
psql -c "SELECT * FROM audit_log WHERE action_type='UPDATE' AND created_at > '<corruption-time>' ORDER BY created_at DESC;"

# Restore from backup (point-in-time recovery)
# Calculate restore timestamp (before corruption)
RESTORE_TIME="2025-11-14 10:30:00"

# Restore database to point in time
pg_restore -d political_sphere_recovery \
  --point-in-time="$RESTORE_TIME" \
  /backup/continuous/base.dump

# Extract correct data
psql -d political_sphere_recovery -c "COPY affected_table TO '/tmp/correct_data.csv' CSV HEADER;"

# Import correct data
psql -d political_sphere <<EOF
BEGIN;
DELETE FROM affected_table WHERE <corruption-condition>;
\copy affected_table FROM '/tmp/correct_data.csv' CSV HEADER;
COMMIT;
EOF

# Verify fix
psql -c "SELECT COUNT(*) FROM affected_table WHERE <validation-condition>;"
```

### Scenario 4: Data Type Mismatch

**Symptoms**:
- Type conversion errors
- Invalid data in columns

**Resolution**:
```bash
# Identify invalid data
psql -c "SELECT * FROM table_name WHERE column_name !~ '^[0-9]+$';"  # Numeric validation

# Clean invalid data
psql <<EOF
UPDATE table_name 
SET column_name = NULL 
WHERE column_name !~ '^[0-9]+$';
EOF

# Add validation constraint
psql -c "ALTER TABLE table_name ADD CONSTRAINT column_name_valid CHECK (column_name ~ '^[0-9]+$');"

# Fix application validation
# Update Zod schema
git checkout hotfix/add-data-validation
./scripts/emergency-deploy.sh
```

### Scenario 5: Encoding Issues

**Symptoms**:
- Corrupted UTF-8 characters
- Mojibake (garbled text)

**Resolution**:
```bash
# Check database encoding
psql -c "SHOW server_encoding;"
psql -c "SELECT datname, pg_encoding_to_char(encoding) FROM pg_database;"

# Identify corrupted text
psql -c "SELECT * FROM table_name WHERE column_name !~ '^[[:print:][:space:]]*$';"

# Convert encoding (if needed)
iconv -f ISO-8859-1 -t UTF-8 /tmp/data.csv > /tmp/data_utf8.csv

# Re-import clean data
psql -c "TRUNCATE table_name;"
psql -c "\copy table_name FROM '/tmp/data_utf8.csv' CSV HEADER ENCODING 'UTF8';"
```

## Escalation

### When to Escalate

- Corruption affects > 10% of data
- Critical data lost (voting records, user accounts)
- Cannot restore from backup
- Incident duration > 1 hour

### Who to Contact

1. **Primary**: Data Team Lead
2. **Secondary**: Database Administrator
3. **Escalation**: CTO + Legal (if user data affected)

## Post-Resolution

### Verification Steps

```bash
# Run full data integrity check
psql -f scripts/data-integrity-check.sql

# Verify foreign key constraints
psql -c "SELECT conname, conrelid::regclass, confrelid::regclass FROM pg_constraint WHERE contype = 'f';"

# Check for duplicates
psql -f scripts/check-duplicates.sql

# Validate data types
psql -f scripts/validate-data-types.sql

# Re-enable writes
psql -c "ALTER DATABASE political_sphere SET default_transaction_read_only = false;"
kubectl set env deployment/api -n production FEATURE_FLAG_DISABLE_WRITES=false

# Scale worker back up
kubectl scale deployment/worker -n production --replicas=3

# Run smoke tests
npm run test:smoke:data
```

### Communication

- Update status page: "Data integrity issue resolved"
- Notify affected users (if applicable)
- Post to #incidents Slack channel
- Document data affected in post-mortem

### Post-Mortem Tasks

1. Identify root cause
2. Implement validation checks
3. Review backup/restore procedures
4. Update data integrity monitoring
5. Schedule follow-up review

## Prevention

### Data Integrity Checks

```sql
-- Create integrity check function
CREATE OR REPLACE FUNCTION check_data_integrity()
RETURNS TABLE(check_name text, status text, details text) AS $$
BEGIN
  -- Check for orphaned records
  RETURN QUERY SELECT 
    'orphaned_votes'::text,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
    'Found ' || COUNT(*) || ' votes without users'
  FROM votes v LEFT JOIN users u ON v.user_id = u.id WHERE u.id IS NULL;
  
  -- Check for duplicates
  RETURN QUERY SELECT
    'duplicate_users'::text,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
    'Found ' || COUNT(*) || ' duplicate emails'
  FROM (SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1) d;
  
  -- Check for invalid dates
  RETURN QUERY SELECT
    'future_created_dates'::text,
    CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END,
    'Found ' || COUNT(*) || ' records with future created_at'
  FROM users WHERE created_at > NOW();
END;
$$ LANGUAGE plpgsql;
```

### Scheduled Integrity Checks

```bash
# Cron job (daily)
0 2 * * * psql -c "SELECT * FROM check_data_integrity() WHERE status='FAIL';" && echo "Data integrity issues detected" | mail -s "Data Integrity Alert" ops@political-sphere.com
```

### Application-Level Validation

```typescript
// apps/api/src/validation/data-integrity.ts
import { z } from 'zod';

export const voteSchema = z.object({
  userId: z.string().uuid(),
  billId: z.string().uuid(),
  value: z.enum(['yes', 'no', 'abstain']),
  createdAt: z.date().max(new Date(), 'Date cannot be in the future'),
}).refine(async (data) => {
  // Validate user exists
  const userExists = await db.query('SELECT 1 FROM users WHERE id = $1', [data.userId]);
  return userExists.rowCount > 0;
}, 'User does not exist');
```

### Database Constraints

```sql
-- Add foreign key constraints
ALTER TABLE votes ADD CONSTRAINT votes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add check constraints
ALTER TABLE votes ADD CONSTRAINT votes_value_check 
  CHECK (value IN ('yes', 'no', 'abstain'));

-- Add unique constraints
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Add NOT NULL constraints
ALTER TABLE votes ALTER COLUMN user_id SET NOT NULL;
```

## References

- [PostgreSQL Data Integrity](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Data Validation Best Practices](https://www.oreilly.com/library/view/database-reliability-engineering/9781491925935/)
- [Backup and Recovery](../disaster-recovery.md)
- [Data Quality Monitoring](../data-quality-monitoring.md)
