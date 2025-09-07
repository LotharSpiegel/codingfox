+++
title = 'React State and Effect Pitfalls'
date = 2025-09-07T12:48:12+02:00
draft = false
wip = true
tags = ['react', 'javascript', 'frontend']
+++

React’s hooks (`useState`, `useEffect`, `useReducer`, etc.) are deceptively simple. At first glance, it feels like: state goes into useState, side effects go into useEffect. But in real-world apps, things get messy quickly: bugs from re-renders, race conditions, and code that’s harder to reason about than it should be.

Let’s break down when to use state, when not to, why overusing useEffect is harmful, and how useReducer can often make your code cleaner.

## 1. What belongs in State?

A common mistake is to throw everything into useState. But not all data needs to be stateful. A good rule of thumb:

**State = any piece of information that changes over time and directly affects what is rendered.**

Examples of true state:

- The current input value of a form field
- Whether a modal is open or closed
- A list of todos fetched from an API

### Derived State

**If some value can be computed from existing state or props, it does not belong in useState. This is derived state.**

Example (bad):
{{< highlight ts >}}
const [items, setItems] = useState([]);
const [count, setCount] = useState(0);

// ❌ count is just items.length, we don’t need it in state
{{< /highlight >}}

Better:
{{< highlight ts >}}
const [items, setItems] = useState([]);
const count = items.length; // ✅ derived value
{{< /highlight >}}


Why? Because duplicating data introduces bugs when one piece updates but the other does not.


## 2. The Overuse of useEffect

`useEffect` is often misunderstood as a “catch-all” for any logic that feels outside rendering. That leads to “effect spaghetti soup” where everything lives in `useEffect`.

**Golden rule: use useEffect only for side effects — things that touch the outside world and where we need to sync something external with the state of our React component.**

Legit uses:

- Fetching data from an API. Note that for this use case more refined solutions like [TanStacks `useQuery`](https://tanstack.com/query/v4/docs/framework/react/guides/queries) could be better suited
- Subscribing/unsubscribing to events
- Manipulating the DOM outside React’s control
- Logging, timers, or analytics

Bad uses:

- Deriving state (where `useEffect` is just used to update another state - see [Derived state](#derived-state))
- Simple computations that could be inline
- Running logic that could live directly in render or event handlers (callbacks)

Actually, most unnecessary uses of `useEffect` fall into one of these categories.


Example (bad):
{{< highlight ts >}}
const [items, setItems] = useState([]);
const [count, setCount] = useState(0);

useEffect(() => {
setCount(items.length);
}, [items]);
{{< /highlight >}}


Better:
{{< highlight ts >}}
const [items, setItems] = useState([]);
const count = items.length;
{{< /highlight >}}


Here, useEffect was completely unnecessary. Each render already has the latest items.

## Why Misusing useEffect is harmful

Overusing useEffect leads to:

- Extra re-renders - setting state inside effects triggers new renders.
- Race conditions, e.g. API requests may resolve in unexpected order.
- Hard-to-debug bugs, e.g. state updated “later” rather than “now”.
- Mental overhead - you always have to think about dependencies and cleanup.

In short: your component becomes less predictable and harder to maintain.