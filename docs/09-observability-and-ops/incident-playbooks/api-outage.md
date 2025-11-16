# API Outage Playbook

**Severity**: Critical (P0)  
**Response Time**: < 15 minutes  
**Owner**: Backend Team  
**Last Updated**: 2025-11-14

## Symptoms

- HTTP 5xx errors from API endpoints
- API not responding to health checks
- Elevated error rates in monitoring
- Users unable to access services
- Load balancer marking API instances unhealthy

## Immediate Actions

### 1. Confirm Outage Scope

```bash
# Check API health endpoint
curl -f https://api.political-sphere.com/health || echo "Health check failed"

# Check all instances
kubectl get pods -n production -l app=api

# Check recent deployments
kubectl rollout history deployment/api -n production

# Check load balancer status
aws elbv2 describe-target-health --target-group-arn <tg-arn>
```

### 2. Check Logs

```bash
# Recent errors
kubectl logs deployment/api -n production --tail=100 | grep -i error

# All pods logs
kubectl logs -l app=api -n production --tail=50

# Check for OOM or crashes
kubectl describe pods -l app=api -n production | grep -A 5 "State"
```

### 3. Check Dependencies

```bash
# Database connectivity
kubectl exec -it deployment/api -n production -- psql -h db.internal -c "SELECT 1;"

# Redis connectivity
kubectl exec -it deployment/api -n production -- redis-cli -h redis.internal ping

# External API status
curl -f https://status.external-service.com
```

## Common Scenarios

### Scenario 1: Recent Deployment Broke API

**Symptoms**:
- Errors started immediately after deployment
- Only new pods are failing

**Resolution**:
```bash
# Immediate rollback
kubectl rollout undo deployment/api -n production

# Monitor rollback
kubectl rollout status deployment/api -n production

# Verify health
watch -n 5 'kubectl get pods -l app=api -n production'

# Check health endpoint
for i in {1..10}; do curl -f https://api.political-sphere.com/health && echo " OK" || echo " FAIL"; sleep 2; done
```

### Scenario 2: Database Connection Pool Exhausted

**Symptoms**:
- Error: "Connection pool timeout"
- Slow API responses

**Resolution**:
```bash
# Check current connections
kubectl exec -it deployment/api -n production -- psql -h db.internal -c \
  "SELECT count(*) FROM pg_stat_activity WHERE application_name='api';"

# Scale up API instances
kubectl scale deployment/api -n production --replicas=10

# Restart API to reset connections
kubectl rollout restart deployment/api -n production

# Tune connection pool (if safe)
# Update API_DB_POOL_MAX in deployment config
kubectl set env deployment/api -n production API_DB_POOL_MAX=20
```

### Scenario 3: Memory Leak / OOM Kills

**Symptoms**:
- Pods restarting frequently
- Error: "OOMKilled" in pod events

**Resolution**:
```bash
# Check pod resource usage
kubectl top pods -l app=api -n production

# Check pod events
kubectl describe pods -l app=api -n production | grep -A 10 "Events"

# Temporary fix: increase memory limit
kubectl set resources deployment/api -n production \
  --limits=memory=2Gi --requests=memory=1Gi

# Restart deployment
kubectl rollout restart deployment/api -n production

# Long-term: Profile application for memory leaks
# Enable heap profiling in next deployment
```

### Scenario 4: Rate Limiting Triggered

**Symptoms**:
- HTTP 429 errors
- Legitimate users blocked

**Resolution**:
```bash
# Check rate limiter status
kubectl exec -it deployment/api -n production -- redis-cli --scan --pattern "rate:*" | wc -l

# Temporarily increase limits (if attack ruled out)
kubectl set env deployment/api -n production RATE_LIMIT_MAX=1000

# Restart API
kubectl rollout restart deployment/api -n production

# Review IP addresses hitting limits
kubectl logs deployment/api -n production | grep "Rate limit exceeded" | awk '{print $NF}' | sort | uniq -c | sort -rn | head -10
```

### Scenario 5: Certificate Expired

**Symptoms**:
- Error: "SSL certificate expired"
- HTTPS connections failing

**Resolution**:
```bash
# Check certificate expiry
echo | openssl s_client -servername api.political-sphere.com -connect api.political-sphere.com:443 2>/dev/null | openssl x509 -noout -dates

# If expired, renew immediately (Let's Encrypt)
certbot renew --force-renewal

# Or update cert in Kubernetes
kubectl create secret tls api-tls --cert=path/to/cert.pem --key=path/to/key.pem --dry-run=client -o yaml | kubectl apply -f -

# Restart ingress controller
kubectl rollout restart deployment/nginx-ingress-controller -n ingress
```

### Scenario 6: Cascading Failure

**Symptoms**:
- Multiple services failing simultaneously
- Dependency chain breakdown

**Resolution**:
```bash
# Identify failing dependencies
kubectl get pods --all-namespaces | grep -v Running

# Check resource exhaustion
kubectl top nodes

# Implement circuit breakers
kubectl set env deployment/api -n production CIRCUIT_BREAKER_ENABLED=true

# Scale critical services first
kubectl scale deployment/api -n production --replicas=5

# Graceful degradation
kubectl set env deployment/api -n production FEATURE_FLAGS_DISABLE_NON_CRITICAL=true
```

## Escalation

### When to Escalate

- API unresponsive after rollback
- Multiple rollback attempts failed
- Database or critical dependency down
- Incident duration > 30 minutes

### Who to Contact

1. **Primary**: API On-Call Engineer
2. **Secondary**: Senior Backend Engineer
3. **Escalation**: Engineering Manager + DevOps Lead

## Post-Resolution

### Verification Steps

```bash
# Run smoke tests
npm run test:smoke:api

# Check error rates
curl "https://app.datadoghq.com/api/v1/query?query=avg:api.error.rate{env:production}"

# Monitor for 15 minutes
watch -n 60 'kubectl get pods -l app=api -n production'

# Verify all endpoints
./scripts/api-health-check.sh
```

### Communication

- Update status page: "API service restored"
- Post to #incidents Slack channel
- Send user notification if outage > 15 minutes
- Update incident timeline

### Post-Mortem Tasks

1. Review deployment process
2. Analyze error logs for root cause
3. Check if canary deployment would have caught issue
4. Update monitoring alerts
5. Document lessons learned

## Prevention

### Monitoring Alerts

- **Health check failures**: Alert if 2+ consecutive failures
- **Error rate**: Alert if > 1% of requests
- **Response time**: Alert if p95 > 500ms
- **Pod restarts**: Alert if > 3 restarts in 10 minutes

### Deployment Best Practices

```yaml
# Use rolling updates with health checks
spec:
  strategy:
    rollingUpdate:
      maxUnavailable: 0
      maxSurge: 1
  template:
    spec:
      containers:
      - name: api
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
```

### Canary Deployments

```bash
# Deploy to 10% of pods first
kubectl patch deployment api -n production -p '{"spec":{"replicas":10}}'
kubectl set image deployment/api api=new-image:tag -n production
kubectl scale deployment/api-canary -n production --replicas=1

# Monitor for 15 minutes
# If successful, roll out to remaining 90%
```

### Circuit Breaker Pattern

```typescript
// apps/api/src/circuit-breaker.ts
import CircuitBreaker from 'opossum';

const breaker = new CircuitBreaker(externalServiceCall, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000,
});

breaker.fallback(() => ({ status: 'degraded', message: 'Service temporarily unavailable' }));
```

## References

- [Kubernetes Deployment Strategies](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [API Gateway Patterns](https://microservices.io/patterns/apigateway.html)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Disaster Recovery Plan](../disaster-recovery.md)
