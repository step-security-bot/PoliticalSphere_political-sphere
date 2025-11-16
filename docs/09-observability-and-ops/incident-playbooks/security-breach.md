# Security Breach Playbook

**Severity**: Critical (P0)  
**Response Time**: Immediate  
**Owner**: Security Team  
**Last Updated**: 2025-11-14

## ⚠️ CRITICAL: Read This First

Security incidents require **immediate action** and strict confidentiality. Do NOT discuss publicly or in open channels until containment is achieved.

**Secure Communication Channels**:
- Internal: #security-incidents (private Slack channel)
- External: security@political-sphere.com (encrypted email)
- Emergency: Security team on-call pager

## Symptoms

- Unusual access patterns in logs
- Alerts from intrusion detection systems
- Reports of data exfiltration
- Unauthorized system modifications
- Credential compromise detected
- Malicious activity in audit logs

## Immediate Actions (First 5 Minutes)

### 1. Confirm Security Incident

```bash
# Check for unauthorized access
kubectl logs -l app=api -n production | grep "UNAUTHORIZED"

# Review recent admin actions
psql -c "SELECT * FROM audit_log WHERE action_type='ADMIN' AND created_at > NOW() - INTERVAL '1 hour';"

# Check Gitleaks alerts
gh api /repos/political-sphere/political-sphere/code-scanning/alerts

# Review authentication logs
kubectl logs deployment/api -n production | grep "auth.*failed"
```

### 2. Contain the Breach

**DO NOT** shut down systems immediately - preserve forensic evidence.

```bash
# Isolate affected systems (preserve logs first)
# Block network access to compromised pods
kubectl label pod <compromised-pod> quarantine=true

# Apply network policy to isolate
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: quarantine
  namespace: production
spec:
  podSelector:
    matchLabels:
      quarantine: "true"
  policyTypes:
  - Ingress
  - Egress
  ingress: []
  egress: []
EOF

# Revoke compromised credentials
# Rotate API keys
aws secretsmanager update-secret --secret-id prod/api-key --secret-string "NEW_KEY"

# Force password reset for affected accounts
psql -c "UPDATE users SET password_reset_required=true WHERE compromised=true;"
```

### 3. Preserve Evidence

```bash
# Capture pod logs before termination
kubectl logs <compromised-pod> -n production > /evidence/pod-logs-$(date +%Y%m%d_%H%M%S).log

# Capture pod state
kubectl describe pod <compromised-pod> -n production > /evidence/pod-state-$(date +%Y%m%d_%H%M%S).txt

# Take disk snapshot
aws ec2 create-snapshot --volume-id vol-xxx --description "Forensic evidence $(date)"

# Export database audit trail
pg_dump -t audit_log -h production-db.internal -U readonly > /evidence/audit_log_$(date +%Y%m%d_%H%M%S).sql
```

## Common Scenarios

### Scenario 1: Credential Compromise

**Symptoms**:
- API keys leaked in public repository
- User credentials stolen via phishing
- Service account compromise

**Resolution**:
```bash
# Immediately revoke compromised credentials
# GitHub token
gh auth token revoke <token>

# AWS access key
aws iam delete-access-key --user-name <user> --access-key-id <key>

# Database password
psql -c "ALTER USER app_user WITH PASSWORD 'new_secure_password';"

# Rotate ALL related secrets
./scripts/rotate-secrets.sh --service api --env production

# Force re-authentication
redis-cli FLUSHDB  # Clear session cache
psql -c "UPDATE users SET force_logout=true;"

# Audit affected resources
aws cloudtrail lookup-events --lookup-attributes AttributeKey=AccessKeyId,AttributeValue=<key>
```

### Scenario 2: SQL Injection Attack

**Symptoms**:
- Unusual database queries in logs
- Data exfiltration attempts
- Database modifications

**Resolution**:
```bash
# Block attacker IP immediately
kubectl exec -it deployment/api -n production -- iptables -A INPUT -s <attacker-ip> -j DROP

# Review database audit logs
psql -c "SELECT * FROM pg_stat_statements WHERE query LIKE '%UNION%' OR query LIKE '%OR 1=1%';"

# Identify affected endpoints
kubectl logs deployment/api -n production | grep "SQL"

# Disable vulnerable endpoint
kubectl set env deployment/api -n production FEATURE_FLAG_VULNERABLE_ENDPOINT=false

# Deploy patch immediately
git checkout hotfix/sql-injection-fix
./scripts/emergency-deploy.sh

# Verify no data exfiltration
psql -c "SELECT * FROM audit_log WHERE action_type='SELECT' AND row_count > 10000;"
```

### Scenario 3: Unauthorized Access to User Data

**Symptoms**:
- Anomalous data access patterns
- Bulk data downloads
- Privileged escalation

**Resolution**:
```bash
# Identify accessed data
psql -c "SELECT user_id, COUNT(*) FROM audit_log WHERE action_type='READ' AND created_at > NOW() - INTERVAL '1 hour' GROUP BY user_id ORDER BY COUNT(*) DESC;"

# Block unauthorized user
psql -c "UPDATE users SET is_active=false WHERE id='<compromised-user-id>';"

# Review permissions
psql -c "SELECT * FROM user_permissions WHERE user_id='<compromised-user-id>';"

# Revoke excessive privileges
psql -c "DELETE FROM user_permissions WHERE user_id='<compromised-user-id>' AND permission_level='ADMIN';"

# Notify affected users (GDPR requirement)
./scripts/breach-notification.sh --affected-users-file users.csv
```

### Scenario 4: Malware/Ransomware Detection

**Symptoms**:
- Unusual file modifications
- Encryption of data files
- Ransom demand message

**Resolution**:
```bash
# Immediately isolate affected systems
kubectl drain node <infected-node> --ignore-daemonsets

# Stop services (preserve data)
kubectl scale deployment/api -n production --replicas=0

# Identify malware signature
kubectl exec -it <pod> -- find / -type f -mtime -1 -ls

# Restore from clean backup (NEVER pay ransom)
# Verify backup integrity first
./scripts/verify-backup.sh --date yesterday

# Restore database from backup
pg_restore -d political_sphere /backup/clean_backup.dump

# Scan all systems for infection
kubectl run malware-scan --image=clamav/clamav --rm -it -- clamscan -r /
```

### Scenario 5: DDoS Attack

**Symptoms**:
- Massive traffic spike
- Service degradation
- Legitimate users unable to access

**Resolution**:
```bash
# Enable rate limiting
kubectl set env deployment/api -n production RATE_LIMIT_ENABLED=true RATE_LIMIT_MAX=100

# Block attack source
# Identify attacker IPs
kubectl logs deployment/nginx-ingress-controller -n ingress | awk '{print $1}' | sort | uniq -c | sort -rn | head -20

# Add IP blocklist
kubectl apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: ip-blocklist
  namespace: ingress
data:
  blocklist: |
    deny <attacker-ip-1>;
    deny <attacker-ip-2>;
EOF

# Enable WAF rules (AWS)
aws wafv2 update-web-acl --id <acl-id> --rules <ddos-protection-rules>

# Scale services
kubectl scale deployment/api -n production --replicas=20

# Contact CDN provider
# Cloudflare: Enable "Under Attack" mode
```

## Legal & Compliance Requirements

### GDPR Data Breach Notification

**Timeline**: 72 hours from discovery

**Steps**:
1. Document breach details (what data, how many users affected)
2. Assess risk to user rights and freedoms
3. Notify Data Protection Officer
4. Report to Information Commissioner's Office (ICO)
5. Notify affected users if high risk

**Template**:
```
Subject: Security Incident Notification

We are writing to inform you of a security incident that may have affected your personal data.

What happened: [Brief description]
Data affected: [Types of data]
Date of incident: [Date]
Our response: [Actions taken]
What you should do: [User actions, if any]

Contact: security@political-sphere.com
```

### Law Enforcement Notification

**When to notify**:
- Criminal activity suspected
- Ongoing attack requiring assistance
- Data breach affecting financial information

**Contact**:
- UK: National Cyber Security Centre (NCSC) - report@ncsc.gov.uk
- US: FBI Cyber Division - https://www.fbi.gov/contact-us

## Escalation

### Immediate Escalation (No Delay)

- Chief Information Security Officer (CISO)
- Data Protection Officer (DPO)
- CEO (for major breaches)
- Legal Counsel
- Public Relations (for public disclosure)

### External Support

- **Forensic Investigator**: Engage within 4 hours for critical incidents
- **Legal**: Consult on disclosure requirements
- **PR**: Prepare public statement if needed
- **Insurance**: Notify cyber insurance provider

## Post-Incident

### Required Actions

1. **Forensic Investigation**: Full root cause analysis
2. **Impact Assessment**: Determine scope of compromise
3. **Remediation**: Fix vulnerabilities
4. **Notification**: Comply with legal requirements (GDPR, etc.)
5. **Monitoring**: Enhanced surveillance for recurrence

### Post-Mortem (Mandatory)

```markdown
# Security Incident Post-Mortem

**Incident ID**: SEC-YYYY-MM-DD-NNN
**Severity**: Critical
**Date**: YYYY-MM-DD
**Duration**: HH:MM
**Responders**: [Names]

## Summary
[What happened]

## Attack Vector
[How attackers gained access]

## Data Compromised
- Personal Data: [Details]
- Credentials: [Details]
- System Access: [Details]

## Response Timeline
- **HH:MM** - Incident detected
- **HH:MM** - Containment initiated
- **HH:MM** - Breach contained
- **HH:MM** - Remediation completed

## Root Cause
[Technical analysis]

## Action Items
1. [ ] Security patch deployed - Owner: [Name] - Due: [Date]
2. [ ] Users notified - Owner: [Name] - Due: [Date]
3. [ ] ICO reported - Owner: [Name] - Due: [Date]
4. [ ] Security audit scheduled - Owner: [Name] - Due: [Date]
```

## Prevention

### Security Hardening

```bash
# Enable audit logging
kubectl set env deployment/api -n production AUDIT_LOG_ENABLED=true

# Implement least privilege
kubectl apply -f rbac-policies/

# Regular security scans
semgrep ci --config auto

# Penetration testing quarterly
./scripts/run-pentest.sh
```

### Monitoring

- Enable AWS GuardDuty
- Configure SIEM alerts (Splunk, ELK)
- Set up honeypots
- Monitor for unusual data access patterns

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [GDPR Breach Notification](https://gdpr.eu/data-breach-notification/)
- [Security Policy](../../06-security-and-risk/security.md)
- [Incident Response Plan](../incident-response-plan.md)
