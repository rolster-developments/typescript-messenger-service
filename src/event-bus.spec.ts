import { registerDependency } from '@rolster/invertly';
import { describe, it, expect, vi } from 'vitest';

import {
  EventBus,
  EventBusSubscriber,
  registerEventBus,
  emitEventBus
} from './event-bus';

class TestSubscriber extends EventBusSubscriber<number, string> {
  execute(value: number): string {
    return `received: ${value}`;
  }
}

class FailingSubscriber extends EventBusSubscriber<number, string> {
  execute(_value: number): Promise<string> {
    return Promise.reject(new Error('fail'));
  }
}

registerDependency(TestSubscriber, { injectable: TestSubscriber });
registerDependency(FailingSubscriber, { injectable: FailingSubscriber });

describe('registerEventBus and emitEventBus', () => {
  it('should execute registered subscriber', async () => {
    registerEventBus({ event: 'test', subscription: TestSubscriber });

    const results = await emitEventBus({ event: 'test', value: 42 });

    expect(results).toEqual(['received: 42']);
  });

  it('should return empty array when no subscribers', async () => {
    const results = await emitEventBus({ event: 'unknown', value: 1 });

    expect(results).toEqual([]);
  });
});

describe('EventBus', () => {
  it('should emit and return results', async () => {
    registerEventBus({ event: 'my-event', subscription: TestSubscriber });

    const bus = new EventBus();
    const results = await bus.emit('my-event', 99);

    expect(results).toEqual(['received: 99']);
  });

  it('should propagate subscriber errors', async () => {
    registerEventBus({ event: 'failing', subscription: FailingSubscriber });

    const bus = new EventBus();

    await expect(bus.emit('failing', 1)).rejects.toThrow('fail');
  });
});
