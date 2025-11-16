import type { Agent, Message, OrchestrationContext, OrchestrationResult } from '../../types';
import { enforcePolicies } from '../../governance';
import { runValidators } from '../../validation/validators';
import { ToolRegistry, executeToolCall } from '../../tools';

interface Args {
  agents: Agent[];
  input: Message[];
  ctx: OrchestrationContext;
}

function roundRobin(index: number, agents: Agent[]): Agent {
  return agents[index % agents.length];
}

/**
 * Group-chat pattern: multiple agents take turns responding.
 * Default facilitator is round-robin, configurable via ctx.config.facilitator.
 */
export async function run({ agents, input, ctx }: Args): Promise<OrchestrationResult> {
  const transcript: Message[] = [...input];
  const obs = ctx.observability;
  const toolRegistry = new ToolRegistry();

  const maxRounds = Number(ctx.config?.maxRounds ?? 4);
  const facilitator: (
    round: number,
    messages: Message[],
    agents: Agent[],
    ctx: OrchestrationContext
  ) => Agent = (ctx.config?.facilitator as any) ?? ((r, _m, as) => roundRobin(r, as));

  // Pre-agent policy stage before conversation rounds begin
  const preAgent = await enforcePolicies(ctx.governance?.policies, {
    runId: ctx.runId,
    messages: transcript,
    stage: 'pre-agent',
    bag: ctx.bag,
  });
  if (!preAgent.ok) return { transcript, completed: false, metadata: { governance: preAgent } };

  for (let round = 0; round < maxRounds; round++) {
    const speaker = facilitator(round, transcript, agents, ctx);
    const res = await speaker.respond(transcript, ctx);
    transcript.push(res.message);
    obs?.onMessage?.({
      runId: ctx.runId,
      from: speaker.id,
      message: res.message,
      stage: `agent.respond.round.${round}`,
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

    const postAgent = await enforcePolicies(ctx.governance?.policies, {
      runId: ctx.runId,
      messages: transcript,
      stage: 'post-agent',
      bag: ctx.bag,
    });
    if (!postAgent.ok) return { transcript, completed: false, metadata: { governance: postAgent } };

    if ((res.metadata as any)?.done) break;
  }

  const output = transcript
    .slice()
    .reverse()
    .find(m => m.role === 'assistant');
  const valid = await runValidators(
    output ?? transcript[transcript.length - 1],
    'output',
    ctx.validators?.output
  );
  if (!valid.ok) return { transcript, output, completed: false, metadata: { validation: valid } };

  return { transcript, output, completed: true };
}
