import { createOrchestrator, defineAgent, composePolicies, composeValidators } from '../src';
import type { Message } from '../src/types';

const brainstormer = defineAgent({
  id: 'brainstormer',
  async respond(messages) {
    return { message: { role: 'assistant', content: 'idea: build a prototype' } };
  },
});
const critic = defineAgent({
  id: 'critic',
  async respond(messages) {
    return { message: { role: 'assistant', content: 'risk: timelines and QA' } };
  },
});
const summarizer = defineAgent({
  id: 'summarizer',
  async respond(messages) {
    return {
      message: {
        role: 'assistant',
        content: 'summary: prototype with risk management',
        metadata: { done: true } as any,
      } as any,
    } as any;
  },
});

async function main() {
  const orchestrator = createOrchestrator({
    pattern: 'group-chat',
    agents: [brainstormer, critic, summarizer],
    config: {
      maxRounds: 5,
      facilitator: (round: number, messages: Message[], agents: any[]) => {
        // If any assistant message contains 'risk', pick summarizer next
        if (messages.some(m => m.role === 'assistant' && m.content.includes('risk')))
          return agents.find(a => a.id === 'summarizer');
        // round-robin otherwise
        return agents[round % agents.length];
      },
    },
    governance: composePolicies(),
    validators: composeValidators(),
  });

  const input: Message[] = [{ role: 'user', content: 'Brainstorm and summarize plan' }];
  const result = await orchestrator.run(input);
  // eslint-disable-next-line no-console
  console.log(
    'Group-chat transcript:',
    result.transcript.map(m => `${m.role}:${m.content}`).join(' | ')
  );
  // eslint-disable-next-line no-console
  console.log('Output:', result.output?.content);
}

if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main();
}
