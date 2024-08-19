import { fromPromise } from '@rolster/commons';
import createFromInvertly, {
  Constructable,
  Context,
  Injectable
} from '@rolster/invertly';

export abstract class Subscriber<T = any, V = any> {
  abstract execute(value: T): V | Promise<V>;
}

type Subscription = Constructable<Subscriber>;

interface RegisterOptions {
  event: string;
  subscription: Subscription;
}

interface EmitterOptions<T = unknown> {
  event: string;
  value: T;
  context?: Context;
}

const events = new Map<string, Set<Subscription>>();

export function registerEventBus(options: RegisterOptions): void {
  const { event, subscription } = options;

  let subscriptions = events.get(event);

  if (!subscriptions) {
    subscriptions = new Set(); // New collection

    events.set(event, subscriptions);
  }

  subscriptions.add(subscription);
}

export function emitEventBus<T>(options: EmitterOptions<T>): Promise<any[]> {
  const { event, value, context } = options;

  const subscriptions = events.get(event);

  if (!subscriptions) {
    return Promise.resolve([]);
  }

  const promises = Array.from(subscriptions).map((token) => {
    const subscription = createFromInvertly({
      config: { context, token }
    });

    return fromPromise(subscription.execute(value));
  });

  return Promise.all(promises);
}

export abstract class EventBus {
  abstract emit<T = any>(event: string, value: T): Promise<any[]>;
}

@Injectable({ singleton: false })
export class RolsterEventBus implements EventBus {
  constructor(private context?: Context) {}

  public emit<T = any>(event: string, value: T): Promise<any[]> {
    return emitEventBus({
      event,
      value,
      context: this.context
    });
  }
}
