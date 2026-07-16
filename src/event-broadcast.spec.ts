import { describe, it, expect, vi } from 'vitest';

import {
  EventBroadcast,
  registerBroadcastChannel,
  registerBroadcastAll,
  emitBroadcast
} from './event-broadcast';

describe('registerBroadcastChannel', () => {
  it('should call the subscription when emit is triggered', () => {
    const subscription = vi.fn();

    registerBroadcastChannel('test-channel', subscription);
    emitBroadcast('test-channel', 'hello');

    expect(subscription).toHaveBeenCalledWith('hello');
  });

  it('should return unsubscribe function', () => {
    const subscription = vi.fn();

    const unsubscribe = registerBroadcastChannel('test', subscription);
    unsubscribe();

    emitBroadcast('test', 'value');

    expect(subscription).not.toHaveBeenCalled();
  });

  it('should not call subscription for different channel', () => {
    const subscription = vi.fn();

    registerBroadcastChannel('channel-a', subscription);
    emitBroadcast('channel-b', 'value');

    expect(subscription).not.toHaveBeenCalled();
  });
});

describe('registerBroadcastAll', () => {
  it('should call broadcast for all channels', () => {
    const broadcast = vi.fn();

    registerBroadcastAll(broadcast);
    emitBroadcast('any-channel', 123);

    expect(broadcast).toHaveBeenCalledWith('any-channel', 123);
  });

  it('should be removable via unsubscribe', () => {
    const broadcast = vi.fn();

    const unsubscribe = registerBroadcastAll(broadcast);
    unsubscribe();

    emitBroadcast('any', 'value');

    expect(broadcast).not.toHaveBeenCalled();
  });
});

describe('EventBroadcast', () => {
  it('should subscribe and emit on channel', () => {
    const bus = new EventBroadcast<string>();
    const subscription = vi.fn();

    bus.subscribe('my-channel', subscription);
    bus.emit('my-channel', { data: true });

    expect(subscription).toHaveBeenCalledWith({ data: true });
  });

  it('should support subscribeAll', () => {
    const bus = new EventBroadcast<string>();
    const broadcast = vi.fn();

    bus.subscribeAll(broadcast);
    bus.emit('ch', 'val');

    expect(broadcast).toHaveBeenCalledWith('ch', 'val');
  });

  it('should unsubscribe individual subscriptions', () => {
    const bus = new EventBroadcast<string>();
    const subscription = vi.fn();

    const unsub = bus.subscribe('ch', subscription);
    unsub();

    bus.emit('ch', 'val');

    expect(subscription).not.toHaveBeenCalled();
  });
});
