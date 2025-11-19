declare module 'openai' {
  export const OpenAI: new (...args: unknown[]) => unknown;
}

declare module 'perspective-api-client' {
  export const PerspectiveAPI: new (...args: unknown[]) => unknown;
}
