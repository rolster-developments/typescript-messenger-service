import { SecureMap, fromPromise } from '@rolster/commons';
import {
  Constructable,
  Context,
  createFromInvertly,
  Injectable
} from '@rolster/invertly';

export abstract class EventBusSubscriber<T = any, V = any> {
  abstract execute(value: T): V | Promise<V>;
}

type Subscription = Constructable<EventBusSubscriber>;

interface RegisterOptions<K = string> {
  event: K;
  subscription: Subscription;
}

interface EmitterOptions<K = string, T = any> {
  event: K;
  value: T;
  context?: Context;
}

const subscriptions = new SecureMap<Set<Subscription>, any>(() => new Set());

export function registerEventBus<K = string>({
  event,
  subscription
}: RegisterOptions<K>): void {
  subscriptions.request(event).add(subscription);
}

export function emitEventBus<T, K = string>({
  event,
  value,
  context
}: EmitterOptions<K, T>): Promise<any[]> {
  const _subscriptions = subscriptions.get(event);

  if (!_subscriptions) {
    return Promise.resolve([]);
  }

  return Promise.all(
    Array.from(_subscriptions).map((token) => {
      const subscription = createFromInvertly({ context, token });

      return fromPromise(subscription.execute(value));
    })
  );
}

export abstract class AbstractEventBus<K = string> {
  abstract emit<T = any>(event: K, value: T): Promise<any[]>;
}

@Injectable({ singleton: false })
export class EventBus<K = string> implements AbstractEventBus<K> {
  constructor(private context?: Context) {}

  public emit<T = any>(event: K, value: T): Promise<any[]> {
    return emitEventBus({ event, value, context: this.context });
  }
}
