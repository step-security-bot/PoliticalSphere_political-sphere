/**
 * Complete AI Development System Example
 *
 * Demonstrates all 6 layers working together:
 * 1. Orchestration (Semantic Kernel patterns)
 * 2. Validation (3-tier gates)
 * 3. Governance (NIST AI RMF)
 * 4. Observability (OpenTelemetry)
 * 5. Accessibility (WCAG 2.2 AA)
 * 6. Privacy (GDPR compliance)
 */

import { createOrchestrator, defineAgent } from '../src';
import { WCAGValidator } from '../src/accessibility/wcag-validator';
import { NISTAIRMFOrchestrator } from '../src/governance/nist-ai-rmf';
import { PoliticalNeutralityEnforcer } from '../src/governance/political-neutrality';
import { logger } from '../src/observability/logging';
import { metrics } from '../src/observability/metrics';
import { tracer } from '../src/observability/tracing';
import { ConsentManager } from '../src/privacy/consent-manager';
import { DSARHandler } from '../src/privacy/dsar-handler';
import { constitutionalGates, mandatoryGates } from '../src/validation';

/**
 * Example: Political Content Analysis with Full Compliance
 */
async function analyzePoliticalContent() {
  // Layer 1: Orchestration - Define AI agents
  const researchAgent = defineAgent({
    id: 'research-agent',
    name: 'Research Agent',
    description: 'Researches political topics with neutrality',
    model: 'gpt-4',
    systemPrompt: 'You are a neutral political researcher. Present all perspectives equally.',
  });

  const analysisAgent = defineAgent({
    id: 'analysis-agent',
    name: 'Analysis Agent',
    description: 'Analyzes political data objectively',
    model: 'gpt-4',
    systemPrompt: 'Analyze political data objectively without bias.',
  });

  // Layer 2: Validation - Set up validation gates
  const politicalNeutralityGate = constitutionalGates[0]; // Tier 0
  const securityGate = mandatoryGates[0]; // Tier 1

  // Layer 3: Governance - Initialize NIST AI RMF
  const governance = new NISTAIRMFOrchestrator();

  // Register AI system
  governance.govern.registerSystem({
    id: 'political-analysis-system',
    name: 'Political Content Analysis System',
    description: 'Analyzes political content with guaranteed neutrality',
    owner: 'AI Governance Team',
    riskLevel: 'critical', // Political content is critical
    model: {
      provider: 'OpenAI',
      version: 'gpt-4-1106',
      type: 'generative',
    },
    dataSources: ['user-input', 'public-datasets'],
    limitations: ['Cannot access real-time data', 'English language only'],
    biasMitigations: [
      'Balanced training data',
      'Political neutrality validation',
      'Human review for sensitive content',
    ],
    registeredAt: new Date(),
  });

  // Layer 4: Observability - Start distributed trace
  const spanId = tracer.startSpan('political-content-analysis', {
    'agent.count': '2',
    'analysis.type': 'political',
  });

  try {
    logger.info('Starting political content analysis', {
      spanId,
      agents: [researchAgent.id, analysisAgent.id],
    });

    // Layer 5: Accessibility - Validate UI output (if generating UI)
    const wcagValidator = new WCAGValidator();

    // Layer 6: Privacy - Check user consent
    const consentManager = new ConsentManager();
    const userId = 'user-123';

    // Verify user has granted consent for analytics
    const hasConsent = consentManager.hasConsent(userId, 'analytics');
    if (!hasConsent) {
      logger.warn('User has not granted analytics consent', { userId, spanId });
      // Proceed without analytics tracking
    }

    // Create orchestrator with all layers
    const orchestrator = createOrchestrator({
      pattern: 'concurrent', // Run agents in parallel
      agents: [researchAgent, analysisAgent],
      config: {
        maxRetries: 3,
        timeout: 30000,
      },
      observability: {
        onStart: async ctx => {
          logger.info('Orchestration started', { runId: ctx.runId, spanId });
          tracer.addEvent(spanId, 'orchestration-start', {
            pattern: ctx.pattern,
            agentCount: ctx.agents.length,
          });
        },
        onAgentStart: async (ctx, agent) => {
          metrics.recordLatency(`agent-${agent.id}`, 0, { status: 'started' });
        },
        onAgentComplete: async (ctx, agent, result) => {
          const duration = result.durationMs || 0;
          metrics.recordLatency(`agent-${agent.id}`, duration, {
            status: result.success ? 'success' : 'error',
          });

          if (result.success) {
            metrics.recordSuccess(`agent-${agent.id}`);
          } else {
            metrics.recordError(`agent-${agent.id}`, result.error?.name || 'unknown');
          }
        },
        onComplete: async (ctx, result) => {
          logger.info('Orchestration completed', {
            runId: ctx.runId,
            spanId,
            success: result.success,
            duration: result.durationMs,
          });

          tracer.addEvent(spanId, 'orchestration-complete', {
            success: result.success,
            agentsCompleted: result.agentResults?.length || 0,
          });
        },
      },
      governance: {
        requireApproval: async ctx => {
          // Political content always requires human review
          const requiresApproval = governance.govern.requiresApproval(
            'political-analysis-system',
            'speech'
          );

          logger.info('Governance check', {
            requiresApproval,
            systemId: 'political-analysis-system',
            spanId,
          });

          return requiresApproval;
        },
      },
      validators: {
        preExecution: async messages => {
          // Validate input before processing
          const inputValidation = await securityGate.validate({
            messages,
            requiresAuth: true,
            user: { id: userId, permissions: ['read'] },
          });

          if (!inputValidation.passed) {
            logger.error('Input validation failed', {
              findings: inputValidation.findings,
              spanId,
            });
            throw new Error('Input validation failed');
          }

          return true;
        },
        postExecution: async (messages, result) => {
          // Validate output for political neutrality
          if (!result.success || !result.finalMessage) {
            return true;
          }

          const outputText = result.finalMessage.content;

          // Constitutional check: Political neutrality
          const neutralityEnforcer = new PoliticalNeutralityEnforcer();
          const neutralityCheck = await neutralityEnforcer.checkNeutrality(outputText);

          if (!neutralityCheck.passed) {
            logger.error('Political neutrality check failed', {
              score: neutralityCheck.neutralityScore,
              biases: neutralityCheck.biases,
              spanId,
            });

            // Tier 0 violation - block immediately
            throw new Error(
              `Political neutrality violation: ${neutralityCheck.biases.map(b => b.description).join(', ')}`
            );
          }

          // Mandatory checks: Bias measurement
          const biasCheck = await governance.measure.measureBias('political-analysis-system', [
            { text: outputText },
          ]);

          if (!biasCheck.passed) {
            logger.warn('Bias threshold exceeded', {
              biasScore: biasCheck.biasScore,
              threshold: 0.1,
              spanId,
            });

            // Trigger incident response
            await governance.manage.respondToIncident({
              systemId: 'political-analysis-system',
              type: 'bias-detected',
              severity: 'high',
              description: `Bias score ${biasCheck.biasScore} exceeds threshold 0.1`,
              timestamp: new Date(),
            });

            throw new Error('Bias threshold exceeded');
          }

          logger.info('All validation gates passed', {
            neutralityScore: neutralityCheck.neutralityScore,
            biasScore: biasCheck.biasScore,
            spanId,
          });

          return true;
        },
      },
    });

    // Execute orchestration
    const result = await orchestrator.run([
      {
        role: 'user',
        content:
          'Analyze the impact of recent electoral reform proposals on democratic participation.',
      },
    ]);

    // Validate accessibility of output (if rendering to UI)
    if (result.finalMessage) {
      const htmlOutput = `<div class="analysis-result">
        <h1>Political Analysis Results</h1>
        <p>${result.finalMessage.content}</p>
      </div>`;

      const accessibilityResult = await wcagValidator.validate(htmlOutput);

      if (!accessibilityResult.passed) {
        logger.error('Accessibility validation failed', {
          violations: accessibilityResult.violations,
          spanId,
        });
        // Fix violations before rendering
      } else {
        logger.info('Accessibility validation passed', {
          passes: accessibilityResult.passes,
          spanId,
        });
      }
    }

    // End trace with success
    tracer.endSpan(spanId, { code: 'ok' });

    // Calculate and log SLO metrics
    const slo = metrics.calculateSLO('political-analysis-system', 3600000); // 1 hour window

    logger.info('SLO metrics', {
      availability: slo.availability,
      latency: slo.latency,
      errorRate: slo.errorRate,
      spanId,
    });

    // Check error budget
    const errorBudget = metrics.getErrorBudget('political-analysis-system', 0.999);
    if (errorBudget.percentConsumed > 80) {
      logger.warn('Error budget critically low', {
        percentConsumed: errorBudget.percentConsumed,
        remaining: errorBudget.remaining,
      });
    }

    return result;
  } catch (error) {
    // End trace with error
    tracer.endSpan(spanId, {
      code: 'error',
      message: error instanceof Error ? error.message : String(error),
    });

    logger.error('Political content analysis failed', error as Error, { spanId });

    metrics.recordError('political-analysis-system', 'analysis-failure');

    throw error;
  }
}

/**
 * Example: User Data Subject Access Request (GDPR)
 */
async function handleUserDSAR() {
  const dsarHandler = new DSARHandler();

  // User requests access to their data
  const request = dsarHandler.createRequest(
    'access',
    'user-123',
    'user@example.com',
    'I would like a copy of all my personal data'
  );

  logger.info('DSAR created', {
    requestId: request.requestId,
    type: request.type,
    dueDate: request.dueDate,
  });

  // Process the request
  const result = await dsarHandler.processAccessRequest(request.requestId);

  if (result.success && result.data) {
    logger.info('DSAR completed successfully', {
      requestId: request.requestId,
      dataKeys: Object.keys(result.data),
    });

    // Return data to user (in production, send via secure email)
    return result.data;
  } else {
    logger.error('DSAR failed', new Error(result.error), {
      requestId: request.requestId,
    });
    throw new Error(result.error);
  }
}

/**
 * Example: Automated Data Retention
 */
async function runDataRetentionJob() {
  const { RetentionPolicyManager } = await import('../src/privacy/retention-policy');

  const retentionManager = new RetentionPolicyManager();

  logger.info('Starting automated data retention job');

  const result = await retentionManager.runDeletionJob();

  logger.info('Data retention job completed', {
    scannedTypes: result.scannedTypes,
    deletedRecords: result.deletedRecords,
    errors: result.errors,
  });

  if (result.errors.length > 0) {
    logger.error('Data retention job had errors', new Error(result.errors.join('; ')));
  }

  return result;
}

/**
 * Run examples
 */
async function main() {
  console.log('🚀 Political Sphere AI Development System - Complete Example\n');

  console.log('1️⃣  Analyzing political content with full compliance...');
  try {
    const analysisResult = await analyzePoliticalContent();
    console.log('✅ Analysis completed successfully\n');
    console.log('Result:', analysisResult.finalMessage?.content.substring(0, 200) + '...\n');
  } catch (error) {
    console.error('❌ Analysis failed:', error instanceof Error ? error.message : String(error));
  }

  console.log('2️⃣  Processing user DSAR (GDPR Article 15)...');
  try {
    const dsarData = await handleUserDSAR();
    console.log('✅ DSAR completed within 30-day SLA\n');
    console.log(
      'Data categories:',
      Object.keys(dsarData as Record<string, unknown>).join(', '),
      '\n'
    );
  } catch (error) {
    console.error('❌ DSAR failed:', error instanceof Error ? error.message : String(error));
  }

  console.log('3️⃣  Running automated data retention job...');
  try {
    const retentionResult = await runDataRetentionJob();
    console.log(`✅ Retention job completed: ${retentionResult.deletedRecords} records deleted\n`);
  } catch (error) {
    console.error(
      '❌ Retention job failed:',
      error instanceof Error ? error.message : String(error)
    );
  }

  console.log('🎉 All examples completed!\n');
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { analyzePoliticalContent, handleUserDSAR, runDataRetentionJob };
