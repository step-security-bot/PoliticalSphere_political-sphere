/**
 * Memory abstraction for orchestrators.
 */
import type { Message } from '../types';

export interface Memory {
  loadTranscript(runId: string): Promise<Message[]>;
  appendMessage(runId: string, message: Message): Promise<void>;
  appendMany?(runId: string, messages: Message[]): Promise<void>;
  truncate?(runId: string, maxMessages?: number): Promise<void>;
}

export class InMemoryMemory implements Memory {
  private store = new Map<string, Message[]>();

  async loadTranscript(runId: string): Promise<Message[]> {
    return [...(this.store.get(runId) ?? [])];
  }

  async appendMessage(runId: string, message: Message): Promise<void> {
    const arr = this.store.get(runId) ?? [];
    arr.push(message);
    this.store.set(runId, arr);
  }

  async appendMany(runId: string, messages: Message[]): Promise<void> {
    const arr = this.store.get(runId) ?? [];
    arr.push(...messages);
    this.store.set(runId, arr);
  }

  async truncate(runId: string, maxMessages = 200): Promise<void> {
    const arr = this.store.get(runId) ?? [];
    if (arr.length > maxMessages) {
      this.store.set(runId, arr.slice(-maxMessages));
    }
  }
}

export const memory = {
  InMemoryMemory,
};
