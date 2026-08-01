+++
title = 'Making Impossible States Impossible with TypeScript Conditional Types'
date = 2026-07-14T00:00:00+02:00
draft = false
tags = ['typescript', 'type-safety', 'conditional-types', 'discriminated-unions', 'developer-experience']
+++

TypeScript is often introduced as a way to add static types to JavaScript. But its real power becomes visible when we stop describing only the shape of data and start modeling relationships between data.

A common challenge in software development is that some values are not independent. One value determines which other values are valid.

TypeScript can help us express these relationships directly in the type system — and prevent invalid states before our code ever runs.

## The problem: types that are too flexible

Imagine an application that tracks different user actions:

{{< highlight ts >}}
type Event = {
  action: string;
  metadata?: Record<string, unknown>;
};
{{< /highlight >}}

This looks simple and flexible. Any action can have any metadata.

But this flexibility comes with a problem: the type system does not know which metadata belongs to which action.

For example, these objects are technically valid:

{{< highlight ts >}}
{
  action: "SETTINGS_SAVED",
  metadata: {
    groupId: "123"
  }
}
{{< /highlight >}}

or:

{{< highlight ts >}}
{
  action: "PAGE_VIEWED",
  metadata: {
    anything: "unexpected"
  }
}
{{< /highlight >}}

The code compiles, but the model is wrong.

The relationship between an action and its metadata exists only in our business logic — TypeScript does not know about it.

This leads to a common problem: how can we make invalid combinations impossible to represent?

## The solution: connecting types with conditional types

Instead of treating every event as the same generic object, we can model the relationship explicitly.

First, we define the possible actions:

{{< highlight ts >}}
export type EventAction =
  | "PAGE_VIEWED"
  | "REPORT_EXPORTED"
  | "SETTINGS_SAVED"
  | "GROUP_CHANGED";
{{< /highlight >}}

Then we define which actions have additional metadata:

{{< highlight ts >}}
type EventMetadata = {
  GROUP_CHANGED: {
    groupId: string;
    groupName: string;
  };

  SETTINGS_SAVED: {
    theme: string;
  };
};
{{< /highlight >}}

Now we can connect both definitions using a conditional type:

{{< highlight ts >}}
export type TrackableEvent<A extends EventAction = EventAction> =
  A extends keyof EventMetadata
    ? {
        eventAction: A;
        metadata: EventMetadata[A];
      }
    : {
        eventAction: A;
        metadata?: never;
      };
{{< /highlight >}}

The idea is simple:

- If an action has metadata defined in `EventMetadata`, require exactly that metadata.
- If an action has no metadata definition, do not allow metadata at all.

## TypeScript now understands the relationship

This is valid:

{{< highlight ts >}}
const event: TrackableEvent = {
  eventAction: "GROUP_CHANGED",
  metadata: {
    groupId: "123",
    groupName: "Customers"
  }
};
{{< /highlight >}}

Because `GROUP_CHANGED` exists in `EventMetadata`, TypeScript knows the required structure.

However, this is rejected:

{{< highlight ts >}}
const event: TrackableEvent = {
  eventAction: "SETTINGS_SAVED",
  metadata: {
    groupId: "123"
  }
};
{{< /highlight >}}

The metadata does not match the action.

The same applies to actions without metadata:

{{< highlight ts >}}
const event: TrackableEvent = {
  eventAction: "PAGE_VIEWED",
  metadata: {
    anything: "not allowed"
  }
};
{{< /highlight >}}

The type `metadata?: never` tells TypeScript: this property must not exist for this case.

## Understanding the generic type parameter `A`

One part of this example can be confusing at first:

{{< highlight ts >}}
export type TrackableEvent<A extends EventAction = EventAction> =
  A extends keyof EventMetadata
    ? {
        eventAction: A;
        metadata: EventMetadata[A];
      }
    : {
        eventAction: A;
        metadata?: never;
      };
{{< /highlight >}}

The generic type parameter `A` is used in two different ways.

### 1. `A` controls the condition

{{< highlight ts >}}
A extends keyof EventMetadata
{{< /highlight >}}

Here, `A` is used as a question: "Does this event action have metadata defined?"

For example:

{{< highlight ts >}}
A = "GROUP_CHANGED"
{{< /highlight >}}

Since `"GROUP_CHANGED"` exists as a key in `EventMetadata`, TypeScript selects the first branch.

### 2. `A` selects the metadata type

{{< highlight ts >}}
metadata: EventMetadata[A]
{{< /highlight >}}

Here, `A` is used as a lookup key.

With:

{{< highlight ts >}}
A = "GROUP_CHANGED"
{{< /highlight >}}

TypeScript resolves:

{{< highlight ts >}}
EventMetadata["GROUP_CHANGED"]
{{< /highlight >}}

into:

{{< highlight ts >}}
{
  groupId: string;
  groupName: string;
}
{{< /highlight >}}

Although `A` appears twice, it represents the same concept in both places: the current event action. The first usage checks whether metadata exists. The second usage retrieves the corresponding metadata definition.

## Why this creates cleaner TypeScript code

The biggest improvement is not only better autocomplete — it is that invalid states become impossible to express.

The type system now enforces a rule: an action either has exactly the metadata it requires, or it has no metadata at all.

This provides several benefits:

- **Safer refactoring** — changing an event definition immediately highlights affected code.
- **Better developer experience** — autocomplete guides developers toward valid structures.
- **Self-documenting code** — the relationship between values is visible directly in the type definitions.
- **Fewer runtime checks** — invalid combinations are caught during development instead of production.

## Beyond events

This pattern is useful whenever one value determines another:

- API request models
- Command handlers
- Redux actions
- Message/event systems
- State machines

TypeScript is not only describing data here — it is encoding rules about how data is allowed to interact.

This is where TypeScript becomes more than a layer of safety on top of JavaScript. It becomes a tool for designing better software models.

## Useful reads

- TypeScript Handbook: [Conditional Types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html)
