#!/usr/bin/env node

/**
 * Generate alerting configurations for Prometheus and Alertmanager
 * Usage: node scripts/observability/generate-alerts.mjs [output-dir]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import the alerting service
// Note: This would need to be built first or use dynamic import
const { AlertingService } = await import('../../libs/observability/src/alerting.ts');

async function generateAlertConfigs(outputDir = 'monitoring-configs') {
  const outputPath = path.resolve(__dirname, '../../', outputDir);

  // Ensure output directory exists
  if (!fs.existsSync(outputPath)) {
    fs.mkdirSync(outputPath, { recursive: true });
  }

  // Create default alerting configuration
  const alertingService = AlertingService.createDefaultConfig();

  // Generate Prometheus rules
  const prometheusRules = alertingService.generatePrometheusRules();
  const prometheusRulesPath = path.join(outputPath, 'prometheus-rules.yml');
  fs.writeFileSync(prometheusRulesPath, prometheusRules);
  console.log(`✅ Generated Prometheus rules: ${prometheusRulesPath}`);

  // Generate Alertmanager configuration
  const alertmanagerConfig = alertingService.generateAlertmanagerConfig();
  const alertmanagerConfigPath = path.join(outputPath, 'alertmanager.yml');
  fs.writeFileSync(alertmanagerConfigPath, alertmanagerConfig);
  console.log(`✅ Generated Alertmanager config: ${alertmanagerConfigPath}`);

  // Generate Docker Compose for monitoring stack
  const dockerCompose = generateDockerCompose();
  const dockerComposePath = path.join(outputPath, 'docker-compose.monitoring.yml');
  fs.writeFileSync(dockerComposePath, dockerCompose);
  console.log(`✅ Generated Docker Compose: ${dockerComposePath}`);

  console.log('\n📋 Alerting configuration generated successfully!');
  console.log(`📁 Output directory: ${outputPath}`);
  console.log('\n🚀 To start the monitoring stack:');
  console.log(`   cd ${outputPath} && docker-compose -f docker-compose.monitoring.yml up -d`);
}

function generateDockerCompose() {
  return `version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus-rules.yml:/etc/prometheus/prometheus-rules.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - monitoring

  alertmanager:
    image: prom/alertmanager:latest
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager.yml:/etc/alertmanager/config.yml
    command:
      - '--config.file=/etc/alertmanager/config.yml'
      - '--storage.path=/alertmanager'
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - monitoring

volumes:
  prometheus_data:
  grafana_data:

networks:
  monitoring:
    driver: bridge
`;
}

const outputDir = process.argv[2] || 'monitoring-configs';
generateAlertConfigs(outputDir).catch(console.error);
