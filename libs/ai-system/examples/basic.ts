import { createOrchestrator, composePolicies, composeValidators, defineAgent } from '../src';
import type { Message, Policy, Validator } from '../src/types';

// Example minimal agent that echoes the last user message.
const echoAgent = defineAgent({
  id: 'echo',
  name: 'Echo Agent',
  async respond(messages) {
    const last =
      [...messages].reverse().find(m => m.role === 'user') ??
      ({ role: 'user', content: '' } as Message);
    return { message: { role: 'assistant', content: `echo: ${last.content}` } };
  },
});

// Simple policy that blocks banned words.
const bannedWords = new Set(['forbidden']);
const bannedWordPolicy: Policy = async ({ messages }) => {
  const last = messages[messages.length - 1];
  if (last && last.role === 'user') {
    for (const word of bannedWords) {
      if (last.content.includes(word)) {
        return {
          ok: false,
          violations: [{ code: 'BANNED_WORD', message: `Input contains banned word: ${word}` }],
        };
      }
    }
  }
  return { ok: true };
};

// Simple length validator for input/output.
const lengthValidator: Validator = async value => {
  const text = typeof value === 'string' ? value : ((value as any)?.content ?? '');
  if (String(text).length > 4096) {
    return { ok: false, errors: [{ message: 'Too long' }] };
  }
  return { ok: true };
};

async function main() {
  const orchestrator = createOrchestrator({
    pattern: 'concurrent',
    agents: [echoAgent],
    governance: composePolicies([bannedWordPolicy]),
    validators: composeValidators([lengthValidator], [lengthValidator]),
  });

  const input: Message[] = [{ role: 'user', content: 'Hello world' }];

  const result = await orchestrator.run(input);
  // eslint-disable-next-line no-console
  console.log('Result:', result.output?.content ?? '(no output)');
}

// Only run if executed directly (ts-node), not when imported.
if (require.main === module) {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  main();
}
