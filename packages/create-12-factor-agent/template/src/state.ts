import crypto from 'crypto';
import { Thread } from '../src/agent';
import { Response } from 'express';

export interface ThreadStore {
    create(thread: Thread): string;
    get(id: string): Thread | undefined;
    update(id: string, thread: Thread): void;
}


// you can replace this with any simple state management,
// e.g. redis, sqlite, postgres, etc
export class InMemoryThreadStore implements ThreadStore {
    private threads: Map<string, Thread> = new Map();
    
    create(thread: Thread): string {
        const id = crypto.randomUUID();
        this.threads.set(id, thread);
        return id;
    }
    
    get(id: string): Thread | undefined {
        return this.threads.get(id);
    }

    update(id: string, thread: Thread): void {
        this.threads.set(id, thread);
    }
}