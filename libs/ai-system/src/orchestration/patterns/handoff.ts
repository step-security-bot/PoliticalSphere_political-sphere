import type { Agent, Message, OrchestrationContext, OrchestrationResult } from '../../types';
import { enforcePolicies } from '../../governance';
import { runValidators } from '../../validation/validators';
import { ToolRegistry, executeToolCall } from '../../tools';

interface Args {
  agents: Agent[];
  input: Message[];
  ctx: OrchestrationContext;
}

/** Router function signature via config.router, default selects first agent. */
function defaultRouter(_messages: Message[], agents: Agent[]): string | undefined {
  return agents[0]?.id;
}

/**
 * Handoff pattern: route to a single agent per turn based on a router function.
 * Loop until completion criteria.
 */
export async function run({ agents, input, ctx }: Args): Promise<OrchestrationResult> {
  const transcript: Message[] = [...input];
  const obs = ctx.observability;
  const toolRegistry = new ToolRegistry();

  const idToAgent = new Map(agents.map(a => [a.id, a] as const));
  const router: (
    messages: Message[],
    agents: Agent[],
    ctx: OrchestrationContext
  ) => string | undefined = (ctx.config?.router as any) ?? ((m, as) => defaultRouter(m, as));

  const maxTurns = Number(ctx.config?.maxTurns ?? 6);
  let turns = 0;

  // Pre-agent policies
  const preAgent = await enforcePolicies(ctx.governance?.policies, {
    runId: ctx.runId,
    messages: transcript,
    stage: 'pre-agent',
    bag: ctx.bag,
  });
  if (!preAgent.ok) return { transcript, completed: false, metadata: { governance: preAgent } };

  while (turns < maxTurns) {
    turns += 1;
    const nextId = router(transcript, agents, ctx);
    if (!nextId) break;
    const agent = idToAgent.get(nextId);
    if (!agent) break;

    const res = await agent.respond(transcript, ctx);
    transcript.push(res.message);
    obs?.onMessage?.({
      runId: ctx.runId,
      from: agent.id,
      message: res.message,
      stage: 'agent.respond',
    });

    if (res.toolCalls?.length) {
      for (const call of res.toolCalls) {
        const toolMsg = await executeToolCall(toolRegistry, {
          name: call.name,
          arguments: call.arguments,
        });
        transcript.push(toolMsg);
        obs?.onMessage?.({
          runId: ctx.runId,
          from: `tool:${call.name}`,
          message: toolMsg,
          stage: 'tool.execute',
        });
      }
    }

    // Post-agent governance after each turn
    const postAgent = await enforcePolicies(ctx.governance?.policies, {
      runId: ctx.runId,
      messages: transcript,
      stage: 'post-agent',
      bag: ctx.bag,
    });
    if (!postAgent.ok) return { transcript, completed: false, metadata: { governance: postAgent } };

    // Optional done flag via message metadata
    if ((res.metadata as any)?.done) break;
  }

  const output = transcript
    .slice()
    .reverse()
    .find(m => m.role === 'assistant');

  // Validate final output
  const valid = await runValidators(
    output ?? transcript[transcript.length - 1],
    'output',
    ctx.validators?.output
  );
  if (!valid.ok) return { transcript, output, completed: false, metadata: { validation: valid } };

  return { transcript, output, completed: true };
}
