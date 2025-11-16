import type { Agent, Message, OrchestrationContext, OrchestrationResult } from '../../types';
import { enforcePolicies } from '../../governance';
import { runValidators } from '../../validation/validators';
import { ToolRegistry, executeToolCall } from '../../tools';

interface Args {
  agents: Agent[];
  input: Message[];
  ctx: OrchestrationContext;
}

/**
 * Concurrent pattern: fan-out the same input to all agents, collect their responses,
 * and return an aggregated result. Selection strategies can be configured; default is first.
 */
export async function run({ agents, input, ctx }: Args): Promise<OrchestrationResult> {
  const transcript: Message[] = [...input];
  const obs = ctx.observability;
  const toolRegistry = new ToolRegistry();

  // Stage: pre-agent policies
  const preAgent = await enforcePolicies(ctx.governance?.policies, {
    runId: ctx.runId,
    messages: transcript,
    stage: 'pre-agent',
    bag: ctx.bag,
  });
  if (!preAgent.ok) return { transcript, completed: false, metadata: { governance: preAgent } };

  // Fan-out
  const responses = await Promise.all(
    agents.map(async agent => {
      try {
        const r = await agent.respond(transcript, ctx);
        obs?.onMessage?.({
          runId: ctx.runId,
          from: agent.id,
          message: r.message,
          stage: 'agent.respond',
        });
        return { agent, result: r };
      } catch (error) {
        await obs?.onError?.({ runId: ctx.runId, error, stage: `agent:${agent.id}` });
        return { agent, result: { message: { role: 'assistant', content: '' } } };
      }
    })
  );

  // Append agent messages and execute tool calls if any
  for (const { agent, result } of responses) {
    transcript.push(result.message);
    if (result.toolCalls && result.toolCalls.length) {
      for (const call of result.toolCalls) {
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
  }

  // Stage: post-agent policies
  const postAgent = await enforcePolicies(ctx.governance?.policies, {
    runId: ctx.runId,
    messages: transcript,
    stage: 'post-agent',
    bag: ctx.bag,
  });
  if (!postAgent.ok) return { transcript, completed: false, metadata: { governance: postAgent } };

  // Select final output
  const selection = (ctx.config?.selection as 'first' | 'last' | 'longest') ?? 'first';
  const assistantMsgs = responses.map(r => r.result.message).filter(m => m.role === 'assistant');
  let output: Message | undefined;
  if (selection === 'first') output = assistantMsgs[0];
  else if (selection === 'last') output = assistantMsgs[assistantMsgs.length - 1];
  else if (selection === 'longest')
    output = assistantMsgs.sort((a, b) => b.content.length - a.content.length)[0];

  // Stage: pre-output validation/policies (pattern-level)
  const valid = await runValidators(
    output ?? assistantMsgs[assistantMsgs.length - 1],
    'output',
    ctx.validators?.output
  );
  if (!valid.ok) return { transcript, output, completed: false, metadata: { validation: valid } };

  return { transcript, output, completed: true };
}
