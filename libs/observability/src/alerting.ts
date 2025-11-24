/**
 * Alerting and Notification System
 *
 * Configures alerting rules and notification channels for monitoring systems.
 */

import type { AlertRule } from './types.js';

type SlackNotificationChannel = NonNullable<AlertingConfig['notificationChannels']['slack']>;
type DiscordNotificationChannel = NonNullable<AlertingConfig['notificationChannels']['discord']>;

type SlackChannelConfig = {
  api_url: string;
  channel: string;
  send_resolved: boolean;
  title: string;
  text: string;
};

type WebhookChannelConfig = {
  url: string;
  send_resolved: boolean;
  http_config: {
    headers: Record<string, string>;
  };
  http_config_data: {
    username: string;
    embeds: Array<{
      title: string;
      description: string;
      color: number;
      fields: Array<{
        name: string;
        value: string;
        inline: boolean;
      }>;
    }>;
  };
};

type ReceiverChannelConfig = {
  slack_configs?: SlackChannelConfig[];
  webhook_configs?: WebhookChannelConfig[];
};

function isSlackChannel(channel: unknown): channel is SlackNotificationChannel {
  return (
    typeof channel === 'object' &&
    channel !== null &&
    'webhookUrl' in channel &&
    'channel' in channel &&
    typeof (channel as SlackNotificationChannel).webhookUrl === 'string' &&
    typeof (channel as SlackNotificationChannel).channel === 'string'
  );
}

function isDiscordChannel(channel: unknown): channel is DiscordNotificationChannel {
  return (
    typeof channel === 'object' &&
    channel !== null &&
    'webhookUrl' in channel &&
    typeof (channel as DiscordNotificationChannel).webhookUrl === 'string'
  );
}

export interface AlertingConfig {
  rules: AlertRule[];
  notificationChannels: {
    slack?: {
      webhookUrl: string;
      channel: string;
    };
    discord?: {
      webhookUrl: string;
      username?: string;
    };
    email?: {
      smtpHost: string;
      smtpPort: number;
      username: string;
      password: string;
      from: string;
      to: string[];
    };
  };
  escalationPolicies: EscalationPolicy[];
}

export interface EscalationPolicy {
  name: string;
  rules: AlertRule[];
  channels: string[];
  escalationDelay: number; // minutes
  maxEscalations: number;
}

class AlertingService {
  private config: AlertingConfig;

  constructor(config: AlertingConfig) {
    this.config = config;
  }

  /**
   * Generate Prometheus alerting rules
   */
  generatePrometheusRules(): string {
    const rules = this.config.rules.map(rule => ({
      alert: rule.name,
      expr: rule.query,
      for: '5m', // Default 5 minute wait
      labels: {
        severity: rule.severity,
        ...rule.labels,
      },
      annotations: {
        summary: `{{ $labels.alertname }}: ${rule.description}`,
        description: rule.description,
      },
    }));

    return `groups:
  - name: political-sphere-api
    rules:
${rules
  .map(
    rule => `    - alert: ${rule.alert}
      expr: ${rule.expr}
      for: ${rule.for}
      labels:
${Object.entries(rule.labels)
  .map(([k, v]) => `        ${k}: "${v}"`)
  .join('\n')}
      annotations:
        summary: "${rule.annotations.summary}"
        description: "${rule.annotations.description}"
`
  )
  .join('\n')}`;
  }

  /**
   * Generate Alertmanager configuration
   */
  generateAlertmanagerConfig(): string {
    const routes = this.config.escalationPolicies.map(policy => ({
      matchers: policy.rules.map(rule => `alertname="${rule.name}"`).join(','),
      group_by: ['alertname'],
      group_wait: '10s',
      group_interval: '10s',
      repeat_interval: '1h',
      receiver: policy.name.toLowerCase().replace(/\s+/g, '-'),
    }));

    const receivers = this.config.escalationPolicies.map(policy => {
      const receiver: ReceiverChannelConfig & { name: string } = {
        name: policy.name.toLowerCase().replace(/\s+/g, '-'),
      };

      // Configure notification channels
      const configs: ReceiverChannelConfig[] = [];

      policy.channels.forEach(channel => {
        const channelConfig =
          this.config.notificationChannels[
            channel as keyof typeof this.config.notificationChannels
          ];
        if (channelConfig) {
          switch (channel) {
            case 'slack':
              if (isSlackChannel(channelConfig)) {
                configs.push({
                  slack_configs: [
                    {
                      api_url: channelConfig.webhookUrl,
                      channel: channelConfig.channel,
                      send_resolved: true,
                      title: '{{ .GroupLabels.alertname }}',
                      text: `{{ .CommonAnnotations.description }}\n\n{{ range .Alerts }}• {{ .Annotations.summary }}\n{{ end }}`,
                    },
                  ],
                });
              }
              break;
            case 'discord':
              if (isDiscordChannel(channelConfig)) {
                configs.push({
                  webhook_configs: [
                    {
                      url: channelConfig.webhookUrl,
                      send_resolved: true,
                      http_config: {
                        headers: {
                          'Content-Type': 'application/json',
                        },
                      },
                      http_config_data: {
                        username: channelConfig.username || 'Alert Bot',
                        embeds: [
                          {
                            title: '{{ .GroupLabels.alertname }}',
                            description: '{{ .CommonAnnotations.description }}',
                            color: 15158332, // Red color
                            fields: [
                              {
                                name: 'Severity',
                                value: '{{ .Labels.severity }}',
                                inline: true,
                              },
                              {
                                name: 'Instance',
                                value: '{{ .Labels.instance }}',
                                inline: true,
                              },
                            ],
                          },
                        ],
                      },
                    },
                  ],
                });
              }
              break;
          }
        }
      });

      if (configs.length > 0) {
        receiver.slack_configs = configs.flatMap(c => c.slack_configs || []);
        receiver.webhook_configs = configs.flatMap(c => c.webhook_configs || []);
      }

      return receiver;
    });

    return `global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@political-sphere.com'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'default'
${routes
  .map(
    route => `  routes:
  - matchers:
    - ${route.matchers}
    group_by: ${JSON.stringify(route.group_by)}
    group_wait: ${route.group_wait}
    group_interval: ${route.group_interval}
    repeat_interval: ${route.repeat_interval}
    receiver: ${route.receiver}
`
  )
  .join('\n')}

receivers:
${receivers
  .map(
    receiver => `- name: ${receiver.name}
  slack_configs: ${JSON.stringify(receiver.slack_configs || [], null, 2)}
  webhook_configs: ${JSON.stringify(receiver.webhook_configs || [], null, 2)}
`
  )
  .join('\n')}`;
  }

  /**
   * Get default alerting rules for the application
   */
  static getDefaultRules(): AlertRule[] {
    return [
      {
        name: 'HighErrorRate',
        query:
          'rate(political_sphere_api_http_requests_total{status_code=~"5.."}[5m]) / rate(political_sphere_api_http_requests_total[5m]) > 0.1',
        threshold: 0.1,
        severity: 'critical',
        description: 'Error rate is above 10%',
        labels: { team: 'backend' },
      },
      {
        name: 'HighResponseTime',
        query:
          'histogram_quantile(0.95, rate(political_sphere_api_http_request_duration_seconds_bucket[5m])) > 5',
        threshold: 5,
        severity: 'warning',
        description: '95th percentile response time is above 5 seconds',
        labels: { team: 'backend' },
      },
      {
        name: 'HighMemoryUsage',
        query:
          'political_sphere_api_memory_usage_bytes / political_sphere_nodejs_heap_size_used_bytes > 0.9',
        threshold: 0.9,
        severity: 'warning',
        description: 'Memory usage is above 90%',
        labels: { team: 'platform' },
      },
      {
        name: 'ApplicationDown',
        query: 'up{job="political-sphere-api"} == 0',
        threshold: 0,
        severity: 'critical',
        description: 'Application is down',
        labels: { team: 'platform' },
      },
      {
        name: 'DatabaseConnectionError',
        query: 'political_sphere_database_connections_active > 100',
        threshold: 100,
        severity: 'warning',
        description: 'Too many active database connections',
        labels: { team: 'database' },
      },
    ];
  }

  /**
   * Get default escalation policies
   */
  static getDefaultEscalationPolicies(): EscalationPolicy[] {
    return [
      {
        name: 'Critical Alerts',
        rules: [], // Will be populated with critical severity rules
        channels: ['slack', 'discord'],
        escalationDelay: 5,
        maxEscalations: 3,
      },
      {
        name: 'Warning Alerts',
        rules: [], // Will be populated with warning severity rules
        channels: ['slack'],
        escalationDelay: 15,
        maxEscalations: 2,
      },
    ];
  }

  /**
   * Create default alerting configuration
   */
  static createDefaultConfig(): AlertingConfig {
    const rules = AlertingService.getDefaultRules();
    const policies = AlertingService.getDefaultEscalationPolicies();

    // Assign rules to policies based on severity
    policies.forEach(policy => {
      if (policy.name === 'Critical Alerts') {
        policy.rules = rules.filter(rule => rule.severity === 'critical');
      } else if (policy.name === 'Warning Alerts') {
        policy.rules = rules.filter(rule => rule.severity === 'warning');
      }
    });

    return {
      rules,
      notificationChannels: {
        slack: {
          webhookUrl: process.env.SLACK_WEBHOOK_URL || '',
          channel: '#alerts',
        },
        discord: {
          webhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
          username: 'Political Sphere Monitor',
        },
      },
      escalationPolicies: policies,
    };
  }
}

export { AlertingService };
export default AlertingService;
