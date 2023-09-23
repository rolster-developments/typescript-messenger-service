import { fromPromise } from '@rolster/helpers-advanced';
import createFromInvertly, {
  Constructable,
  Context,
  Injectable
} from '@rolster/invertly';

export abstract class Subscriber<T = unknown> {
  abstract execute(value: T): any | Promise<any>;
}

type Subscription = Constructable<Subscriber>;

interface RegisterProps {
  event: string;
  subscription: Subscription;
}

interface Emitter<T = unknown> {
  event: string;
  value: T;
  context?: Context;
}

const events = new Map<string, Set<Subscription>>();

export function registerPubSub(props: RegisterProps): void {
  const { event, subscription } = props;

  let eventSet = events.get(event);

  if (!eventSet) {
    eventSet = new Set();

    events.set(event, eventSet);
  }

  eventSet.add(subscription);
}

export function emitPubSub<T>(config: Emitter<T>): Promise<any[]> {
  const { event, value, context } = config;

  const subscriptions = events.get(event);

  if (!subscriptions) {
    return Promise.resolve([]);
  }

  const promises = Array.from(subscriptions).map((token) => {
    const subscription = createFromInvertly({
      config: { token, context }
    });

    return fromPromise(subscription.execute(value));
  });

  return Promise.all(promises);
}

export abstract class PubSub {
  abstract emit<T = unknown>(event: string, value: T): Promise<any[]>;
}

@Injectable({ singleton: false })
export class RolsterPubSub implements PubSub {
  constructor(private context?: Context) {}

  public emit<T = unknown>(event: string, value: T): Promise<any[]> {
    return emitPubSub({ event, value, context: this.context });
  }
}
