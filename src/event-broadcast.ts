import { SecureMap } from '@rolster/commons';
import { v4 as uuid } from 'uuid';

type Broadcast<C = any> = (channel: C, value: any) => void;
type Subscription<V = any> = (value: V) => void;

const broadcasts = new Map<any, Broadcast>();
const subscriptions = new SecureMap<Map<any, Subscription>, any>(
  () => new Map()
);

export function registerBroadcastChannel<C = string, V = any>(
  channel: C,
  subscription: Subscription<V>
): Unsubscription {
  const _uuid = uuid();

  const _subscriptions = subscriptions.request(channel);

  _subscriptions.set(_uuid, subscription);

  return () => {
    _subscriptions.delete(_uuid);
  };
}

export function registerBroadcastAll<C = string>(
  broadcast: Broadcast<C>
): Unsubscription {
  const _uuid = uuid();

  broadcasts.set(_uuid, broadcast);

  return () => {
    broadcasts.delete(_uuid);
  };
}

export function emitBroadcast<C = string, V = any>(channel: C, value: V): void {
  const _subscriptions = subscriptions.get(channel);

  if (_subscriptions) {
    Array.from(_subscriptions.values()).forEach((subscription) => {
      subscription(value);
    });
  }

  Array.from(broadcasts.values()).forEach((broadcast) => {
    broadcast(channel, value);
  });
}

export class EventBroadcast<C = string> {
  public subscribe<V = any>(
    channel: C,
    subscription: Subscription<V>
  ): Unsubscription {
    return registerBroadcastChannel(channel, subscription);
  }

  public subscribeAll(broadcast: Broadcast<C>): Unsubscription {
    return registerBroadcastAll(broadcast);
  }

  public emit<V = any>(channel: C, value: V): void {
    emitBroadcast(channel, value);
  }
}
