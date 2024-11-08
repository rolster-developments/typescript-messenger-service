import { SecureMap, fromPromise } from '@rolster/commons';
import createFromInvertly, {
  Constructable,
  Context,
  Injectable
} from '@rolster/invertly';

export abstract class EventBusSubscriber<T = any, V = any> {
  abstract execute(value: T): V | Promise<V>;
}

type EventBusSubscription = Constructable<EventBusSubscriber>;

interface RegisterOptions {
  event: string;
  subscription: EventBusSubscription;
}

interface EmitterOptions<T = unknown> {
  event: string;
  value: T;
  context?: Context;
}

const events = new SecureMap<Set<EventBusSubscription>>(() => new Set());

export function registerEventBus(options: RegisterOptions): void {
  const { event, subscription } = options;

  const subscriptions = events.request(event);

  subscriptions.add(subscription);
}

export function emitEventBus<T>(options: EmitterOptions<T>): Promise<any[]> {
  const { event, value, context } = options;

  const subscriptions = events.get(event);

  if (!subscriptions) {
    return Promise.resolve([]);
  }

  return Promise.all(
    Array.from(subscriptions).map((token) => {
      const subscription = createFromInvertly({ context, token });

      return fromPromise(subscription.execute(value));
    })
  );
}

export abstract class AbstractEventBus {
  abstract emit<T = any>(event: string, value: T): Promise<any[]>;
}

@Injectable({ singleton: false })
export class EventBus implements AbstractEventBus {
  constructor(private context?: Context) {}

  public emit<T = any>(event: string, value: T): Promise<any[]> {
    return emitEventBus({
      event,
      value,
      context: this.context
    });
  }
}
