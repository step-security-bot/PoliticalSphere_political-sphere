/**
 * AI Model Registry
 *
 * Centralized registry for all AI models and systems.
 *
 * @module governance/model-registry
 */

import type { AISystemRegistration } from './nist-ai-rmf';

/**
 * Model Registry
 *
 * Tracks all AI models used in Political Sphere.
 */
export class ModelRegistry {
  private models: Map<string, AISystemRegistration> = new Map();

  /**
   * Register a new model
   */
  register(model: AISystemRegistration): void {
    this.models.set(model.id, {
      ...model,
      registeredAt: new Date(),
    });
  }

  /**
   * Get model by ID
   */
  get(id: string): AISystemRegistration | undefined {
    return this.models.get(id);
  }

  /**
   * List all models
   */
  listAll(): AISystemRegistration[] {
    return Array.from(this.models.values());
  }

  /**
   * List models by risk level
   */
  listByRisk(riskLevel: AISystemRegistration['riskLevel']): AISystemRegistration[] {
    return this.listAll().filter(m => m.riskLevel === riskLevel);
  }

  /**
   * Update model audit date
   */
  recordAudit(id: string): void {
    const model = this.models.get(id);
    if (model) {
      model.lastAuditedAt = new Date();
    }
  }

  /**
   * Get models requiring audit (>90 days since last audit)
   */
  getModelsRequiringAudit(): AISystemRegistration[] {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    return this.listAll().filter(m => {
      if (!m.lastAuditedAt) return true;
      return m.lastAuditedAt < ninetyDaysAgo;
    });
  }

  /**
   * Generate registry report
   */
  generateReport(): {
    totalModels: number;
    byRisk: Record<string, number>;
    requiresAudit: number;
    averageAge: number;
  } {
    const all = this.listAll();
    const byRisk = {
      low: this.listByRisk('low').length,
      medium: this.listByRisk('medium').length,
      high: this.listByRisk('high').length,
      critical: this.listByRisk('critical').length,
    };

    const requiresAudit = this.getModelsRequiringAudit().length;

    const now = Date.now();
    const totalAge = all.reduce((sum, m) => {
      return sum + (now - m.registeredAt.getTime());
    }, 0);
    const averageAge = all.length > 0 ? totalAge / all.length / (1000 * 60 * 60 * 24) : 0; // days

    return {
      totalModels: all.length,
      byRisk,
      requiresAudit,
      averageAge,
    };
  }
}
