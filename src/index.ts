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
  events.request(options.event).add(options.subscription);
}

export function emitEventBus<T>(options: EmitterOptions<T>): Promise<any[]> {
  const subscriptions = events.get(options.event);

  return !subscriptions
    ? Promise.resolve([])
    : Promise.all(
        Array.from(subscriptions).map((token) => {
          const subscription = createFromInvertly({
            context: options.context,
            token
          });

          return fromPromise(subscription.execute(options.value));
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
