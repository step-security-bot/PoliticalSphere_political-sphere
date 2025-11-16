import { createOrchestrator, composePolicies, composeValidators, defineAgent } from '../src';
import type { Message, Policy } from '../src/types';

const analyst = defineAgent({
  id: 'analyst',
  async respond(messages) {
    const user = [...messages].reverse().find(m => m.role === 'user');
    const content = user ? `analysis: ${user.content}` : 'analysis: (no input)';
    return { message: { role: 'assistant', content } };
  },
});

const summarizer = defineAgent({
  id: 'summarizer',
  async respond(messages) {
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');
    const summary = lastAssistant
      ? `summary: ${lastAssistant.content.slice(0, 60)}`
      : 'summary: (nothing to summarize)';
    return { message: { role: 'assistant', content: summary } };
  },
});

const safeOutputPolicy: Policy = async ({ messages, stage }) => {
  if (stage !== 'pre-output') return { ok: true };
  const last = messages[messages.length - 1];
  if (last?.role === 'assistant' && /forbidden/i.test(last.content)) {
    return {
      ok: false,
      violations: [{ code: 'UNSAFE_OUTPUT', message: 'Output contains forbidden content' }],
    };
  }
  return { ok: true };
};

async function main() {
  const orchestrator = createOrchestrator({
    pattern: 'group-chat',
    agents: [analyst, summarizer],
    governance: composePolicies([safeOutputPolicy]),
    validators: composeValidators(),
  });

  const input: Message[] = [{ role: 'user', content: 'Explain GDP and summarize.' }];
  const result = await orchestrator.run(input);
  // eslint-disable-next-line no-console
  console.log('Group chat output:', result.output?.content);
}

if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main();
}
