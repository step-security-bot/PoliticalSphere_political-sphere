/**
 * Bias Monitoring System
 *
 * Continuous monitoring for AI bias with alerting.
 *
 * @module governance/bias-monitoring
 */

/**
 * Bias metric
 */
export interface BiasMetric {
  /** Metric timestamp */
  timestamp: Date;
  /** System ID */
  systemId: string;
  /** Bias score (0-1, lower is better) */
  biasScore: number;
  /** Metric breakdown */
  metrics: {
    sentimentVariance: number;
    keywordBalance: number;
    framingNeutrality: number;
    demographicParity?: number;
  };
  /** Sample size */
  sampleSize: number;
}

/**
 * Bias alert
 */
export interface BiasAlert {
  /** Alert ID */
  id: string;
  /** System ID */
  systemId: string;
  /** Alert timestamp */
  timestamp: Date;
  /** Alert severity */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Alert message */
  message: string;
  /** Bias metrics that triggered alert */
  metrics: BiasMetric;
  /** Alert status */
  status: 'active' | 'acknowledged' | 'resolved';
}

/**
 * Bias Monitoring System
 *
 * Tracks bias metrics over time and triggers alerts.
 */
export class BiasMonitoringSystem {
  private metrics: BiasMetric[] = [];
  private alerts: BiasAlert[] = [];
  private readonly biasThreshold = 0.1; // Alert if bias > 0.1

  /**
   * Record bias metric
   */
  recordMetric(metric: BiasMetric): void {
    this.metrics.push(metric);

    // Check if alert should be triggered
    if (metric.biasScore > this.biasThreshold) {
      this.triggerAlert(metric);
    }
  }

  /**
   * Trigger bias alert
   */
  private triggerAlert(metric: BiasMetric): void {
    const severity = this.calculateSeverity(metric.biasScore);

    const alert: BiasAlert = {
      id: `alert-${Date.now()}`,
      systemId: metric.systemId,
      timestamp: new Date(),
      severity,
      message: `Bias threshold exceeded: ${metric.biasScore.toFixed(3)} > ${this.biasThreshold}`,
      metrics: metric,
      status: 'active',
    };

    this.alerts.push(alert);

    // Log alert (in production, send to monitoring system)
    console.warn(`[BIAS ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`, {
      systemId: alert.systemId,
      biasScore: metric.biasScore,
      sampleSize: metric.sampleSize,
    });
  }

  /**
   * Calculate alert severity based on bias score
   */
  private calculateSeverity(biasScore: number): BiasAlert['severity'] {
    if (biasScore > 0.3) return 'critical';
    if (biasScore > 0.2) return 'high';
    if (biasScore > 0.15) return 'medium';
    return 'low';
  }

  /**
   * Get bias trend for system
   */
  getTrend(
    systemId: string,
    daysBack: number = 7
  ): {
    average: number;
    trend: 'improving' | 'worsening' | 'stable';
    metrics: BiasMetric[];
  } {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysBack);

    const recentMetrics = this.metrics.filter(
      m => m.systemId === systemId && m.timestamp >= cutoff
    );

    if (recentMetrics.length === 0) {
      return { average: 0, trend: 'stable', metrics: [] };
    }

    // Calculate average
    const average = recentMetrics.reduce((sum, m) => sum + m.biasScore, 0) / recentMetrics.length;

    // Determine trend (compare first half vs second half)
    const midpoint = Math.floor(recentMetrics.length / 2);
    const firstHalf = recentMetrics.slice(0, midpoint);
    const secondHalf = recentMetrics.slice(midpoint);

    const firstAvg = firstHalf.reduce((sum, m) => sum + m.biasScore, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.biasScore, 0) / secondHalf.length;

    const trend =
      secondAvg < firstAvg - 0.05
        ? 'improving'
        : secondAvg > firstAvg + 0.05
          ? 'worsening'
          : 'stable';

    return { average, trend, metrics: recentMetrics };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): BiasAlert[] {
    return this.alerts.filter(a => a.status === 'active');
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'acknowledged';
    }
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'resolved';
    }
  }

  /**
   * Generate monitoring report
   */
  generateReport(): {
    totalMetrics: number;
    averageBias: number;
    activeAlerts: number;
    systemsAboveThreshold: string[];
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    // Calculate overall average
    const averageBias =
      this.metrics.length > 0
        ? this.metrics.reduce((sum, m) => sum + m.biasScore, 0) / this.metrics.length
        : 0;

    // Find systems above threshold
    const systemsAboveThreshold = Array.from(
      new Set(this.metrics.filter(m => m.biasScore > this.biasThreshold).map(m => m.systemId))
    );

    // Generate recommendations
    if (averageBias > this.biasThreshold) {
      recommendations.push('Overall bias exceeds threshold - review training data');
      recommendations.push('Implement additional bias mitigation strategies');
    }

    if (systemsAboveThreshold.length > 0) {
      recommendations.push(`${systemsAboveThreshold.length} systems require immediate review`);
    }

    const activeAlerts = this.getActiveAlerts().length;
    if (activeAlerts > 5) {
      recommendations.push('High alert volume - consider systematic review');
    }

    return {
      totalMetrics: this.metrics.length,
      averageBias,
      activeAlerts,
      systemsAboveThreshold,
      recommendations,
    };
  }
}
