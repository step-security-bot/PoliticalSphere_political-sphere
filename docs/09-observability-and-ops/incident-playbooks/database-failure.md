# Database Failure Playbook

**Severity**: Critical (P0)  
**Response Time**: < 15 minutes  
**Owner**: Database Team  
**Last Updated**: 2025-11-14

## Symptoms

- Database connection errors in application logs
- High latency or timeouts on database queries
- Database process not running
- Disk space full on database server
- Replication lag exceeding threshold

## Immediate Actions

### 1. Confirm Database Status

```bash
# Check database process
ps aux | grep postgres

# Check database connectivity
psql -h production-db.internal -U readonly -c "SELECT 1;"

# Check replication status
psql -h production-db.internal -U readonly -c "SELECT * FROM pg_stat_replication;"

# Check disk space
df -h /var/lib/postgresql
```

### 2. Check Recent Logs

```bash
# PostgreSQL logs
tail -n 100 /var/log/postgresql/postgresql-*.log

# System logs
journalctl -u postgresql -n 100 --no-pager
```

### 3. Assess Impact

- **Read Operations**: Can you SELECT from database?
- **Write Operations**: Can you INSERT/UPDATE?
- **Replication**: Are replicas in sync?
- **Backups**: When was last successful backup?

## Common Scenarios

### Scenario 1: Disk Space Full

**Symptoms**:
- Error: "No space left on device"
- Write operations failing

**Resolution**:
```bash
# Check what's using space
du -sh /var/lib/postgresql/*

# Clear old WAL logs (if safe)
sudo -u postgres pg_archivecleanup /var/lib/postgresql/13/main/pg_wal <oldest_keep_file>

# Vacuum database
psql -c "VACUUM FULL;"

# Extend disk if needed (AWS)
aws ec2 modify-volume --volume-id vol-xxx --size 200
```

### Scenario 2: Connection Limit Reached

**Symptoms**:
- Error: "FATAL: sorry, too many clients already"

**Resolution**:
```bash
# Check current connections
psql -c "SELECT count(*) FROM pg_stat_activity;"

# Kill idle connections
psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND state_change < now() - interval '10 minutes';"

# Increase max_connections (requires restart)
# Edit postgresql.conf
max_connections = 200

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Scenario 3: Database Process Crashed

**Symptoms**:
- PostgreSQL process not running
- "Connection refused" errors

**Resolution**:
```bash
# Check if process is running
systemctl status postgresql

# Start database
sudo systemctl start postgresql

# Check for recovery
tail -f /var/log/postgresql/postgresql-*.log

# If won't start, check for lock files
ls -la /var/lib/postgresql/13/main/postmaster.pid
rm /var/lib/postgresql/13/main/postmaster.pid  # If stale
```

### Scenario 4: Replication Lag

**Symptoms**:
- Read replicas showing old data
- Lag metric exceeding threshold

**Resolution**:
```bash
# Check replication lag
psql -h replica.internal -c "SELECT now() - pg_last_xact_replay_timestamp() AS replication_lag;"

# Check replication status on primary
psql -h primary.internal -c "SELECT * FROM pg_stat_replication;"

# Restart replica if stuck
sudo systemctl restart postgresql  # On replica

# If lag continues, investigate primary load
psql -h primary.internal -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
```

### Scenario 5: Corruption Detected

**Symptoms**:
- Error: "invalid page header"
- Data inconsistencies

**Resolution**:
```bash
# DO NOT write to database
# Immediately stop application writes

# Take snapshot/backup
pg_dump -h primary.internal -U backup -Fc political_sphere > /backup/emergency_$(date +%Y%m%d_%H%M%S).dump

# Check for corruption
pg_amcheck -d political_sphere

# If corruption confirmed:
# 1. Restore from last good backup
# 2. Replay WAL logs if possible
# 3. Contact database team immediately
```

## Escalation

### When to Escalate

- Database won't start after standard recovery
- Data corruption detected
- Backup restoration required
- Incident duration > 30 minutes

### Who to Contact

1. **Primary**: Database On-Call Engineer
2. **Secondary**: Senior Database Administrator
3. **Escalation**: CTO + Infrastructure Lead

## Post-Resolution

### Verification Steps

```bash
# Verify database is accepting connections
psql -h production-db.internal -U app -c "SELECT 1;"

# Run smoke tests
npm run test:smoke:database

# Check replication status
psql -h production-db.internal -c "SELECT * FROM pg_stat_replication;"

# Monitor for 30 minutes
watch -n 60 'psql -c "SELECT count(*) FROM pg_stat_activity;"'
```

### Communication

- Update status page: "Database service restored"
- Post to #incidents Slack channel
- Notify affected users if downtime was significant

### Post-Mortem Tasks

1. Document timeline of events
2. Identify root cause
3. Review backup/recovery procedures
4. Update monitoring thresholds if needed
5. Schedule follow-up review meeting

## Prevention

### Monitoring Alerts

- **Disk space**: Alert at 80% usage
- **Connection count**: Alert at 80% of max_connections
- **Replication lag**: Alert if > 30 seconds
- **Query duration**: Alert on queries > 5 seconds

### Proactive Maintenance

- **Weekly**: Review slow query log
- **Monthly**: Vacuum analyze database
- **Quarterly**: Test backup restoration
- **Yearly**: Review capacity planning

### Capacity Planning

```sql
-- Check database size growth
SELECT pg_size_pretty(pg_database_size('political_sphere'));

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC
LIMIT 10;
```

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/current/)
- [AWS RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [Disaster Recovery Plan](../disaster-recovery.md)
- [Database Backup Procedures](../database-backup.md)
