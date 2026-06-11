# Rolster Messenger Service

Library that allows you to manage messaging services.

## Installation

```
npm i @rolster/messenger-service
```

## Configuration

You must install the `@rolster/types` to define package data types, which are configured by adding them to the `files` property of the `tsconfig.json` file.

```json
{
  "files": ["node_modules/@rolster/types/index.d.ts"]
}
```

## Overview

The package implements two complementary messaging patterns:

- **Event Bus** — each event is handled by class-based subscribers resolved
  through dependency injection ([`@rolster/invertly`](https://www.npmjs.com/package/@rolster/invertly));
  emitting awaits every handler and returns their results. Ideal for the
  backend / command-handler side.
- **Event Broadcast** — a lightweight, synchronous pub/sub with plain function
  callbacks and per-subscription unsubscribe. Ideal for in-app fan-out
  notifications.

## Event Bus

Define a handler by extending `EventBusSubscriber<T, V>` and implementing
`execute(value)`. Register it for an event, then emit:

```typescript
import {
  EventBusSubscriber,
  registerEventBus,
  emitEventBus,
  EventBus
} from '@rolster/messenger-service';

interface UserCreated {
  id: string;
  name: string;
}

class SendWelcomeEmail extends EventBusSubscriber<UserCreated, void> {
  execute(user: UserCreated): void {
    console.log(`Welcome, ${user.name}!`);
  }
}

// Register the subscriber for the event
registerEventBus({ event: 'user:created', subscription: SendWelcomeEmail });

// Emit it — resolves with the array of every subscriber's result
await emitEventBus({
  event: 'user:created',
  value: { id: '1', name: 'Daniel' }
});
```

You can register several subscribers for the same event; `emitEventBus` runs
them all (`Promise.all`) and returns their results. Subscriber instances are
created via `@rolster/invertly`, so they can receive injected dependencies.

The injectable `EventBus` class is a thin wrapper carrying a DI `context`,
convenient inside other injectables:

```typescript
class UserService {
  constructor(private readonly eventBus: EventBus) {}

  async create(name: string): Promise<void> {
    // ...persist the user...
    await this.eventBus.emit('user:created', { id: '1', name });
  }
}
```

## Event Broadcast

A synchronous publish/subscribe. Subscribe to a channel (or to *all* channels)
and receive an `Unsubscription` function to detach later.

```typescript
import { EventBroadcast } from '@rolster/messenger-service';

const broadcast = new EventBroadcast<string>();

// Listen to a specific channel
const off = broadcast.subscribe<{ message: string }>('toast', (value) => {
  console.log('Toast:', value.message);
});

// Listen to every channel (receives channel + value)
broadcast.subscribeAll((channel, value) => {
  console.log(`[${channel}]`, value);
});

// Emit — reaches the channel subscribers and every "all" listener
broadcast.emit('toast', { message: 'Saved!' });

off(); // stop listening to the 'toast' channel
```

The same behaviour is available as standalone functions when you don't want to
hold an instance: `registerBroadcastChannel(channel, fn)`,
`registerBroadcastAll(fn)` and `emitBroadcast(channel, value)`.

## Contributing

- Daniel Andrés Castillo Pedroza :rocket:
