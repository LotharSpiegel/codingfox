+++
title = 'React State and Effect Pitfalls'
date = 2025-09-07T12:48:12+02:00
draft = false
wip = true
tags = ['react', 'javascript', 'frontend']
+++

React’s hooks (in particular `useState` and `useEffect`) are deceptively simple. At first glance, it feels like: state goes into useState, side effects go into useEffect. But in real-world apps, things get messy quickly: bugs from re-renders, race conditions, and code that’s harder to reason about than it should be.

Let’s break down when to use state, when not to, why overusing useEffect is harmful, and how useReducer can often make your code cleaner.

## 1. What belongs in State?

A common mistake is to throw everything into `useState`. But not all data needs to be stateful. Here's a good rule of thumb:

**State = any piece of information that changes over time and directly affects what is rendered.**

Examples of true state:

- The current input value of a form field
- Whether a modal is open or closed
- A list of todos fetched from an API

### Derived State

**If a value can be computed from existing state or props, it does not belong in `useState`. This is called derived state.**

Example (bad):
{{< highlight ts >}}
const [items, setItems] = useState([]);
const [count, setCount] = useState(0);

// ❌ count can be derived from items as it simply is items.length, we don’t need it in state

useEffect(() => {
setCount(items.length);
}, [items]);

// ❌ This useEffect is unnecessary if we simply derive count from items.
{{< /highlight >}}


Better:
{{< highlight ts >}}
const [items, setItems] = useState([]);
const count = items.length; // ✅ derived value
{{< /highlight >}}


Why? Because duplicating data introduces bugs when one piece updates but the other does not. Additionally, it avoids unnecessary re-renders.

Note: If computing the derived state is expensive, you can memoize it using `useMemo`. However, I recommend avoiding premature optimization — only memoize for genuinely heavy computations, which are rare in most applications.

## 2. The Overuse of useEffect

`useEffect` is often misunderstood as a "catch-all" for any logic that feels outside the normal rendering flow. This misunderstanding leads to "effect spaghetti soup" where too much logic lives in `useEffect` hooks.

**Golden rule: use `useEffect` only for side effects — operations that interact with the outside world and where we need to synchronize something external with the state of our React component.**

Legit uses:

- Fetching data from an API. Note that for this use case, more refined solutions like [TanStack's `useQuery`](https://tanstack.com/query/v4/docs/framework/react/guides/queries) are often better suited
- Subscribing/unsubscribing to events
- Manipulating the DOM outside React’s control or integrating with non-React widgets
- Logging, timers, or analytics

Bad uses:

- Deriving state, where `useEffect` is just used to update another state variable - see [Derived state](#derived-state) for a typical example.
- Simple computations that could be inline
- Running logic that could live directly in render or event handlers, e.g., callbacks from user interactions (click, submit, etc.)
- Passing data from a child component to a parent component. Instead, data flow in React should always go from top to bottom.

In practice, most unnecessary uses of `useEffect` fall into one of these categories.


Example (bad):
{{< highlight ts >}}
useEffect(() => {
setFiltered(items.filter(...));
}, [items]);
// ❌ This use of useEffect will cause unnecessary extra renders.
{{< /highlight >}}


Better:
{{< highlight ts >}}
const filtered = items.filter(...);
// ✅ Much easier to read and reason about.
{{< /highlight >}}



## Why Misusing useEffect is harmful

Overusing `useEffect` leads to:

- Extra re-renders - setting state inside effects triggers new render cycles.
- Race conditions, e.g., API requests may resolve in unexpected orders.
- Hard-to-debug bugs, e.g., state updated "later" rather than "now".
- Mental overhead - you always have to think about dependency arrays and cleanup functions.

In short: your component becomes less predictable and harder to maintain.



The reason why mutating state in `useEffect` causes re-renders comes from the way React works:
1. When state is updated, React calls the component functions to determine what should be rendered to the screen.
2. Then React "commits" these changes to the DOM.
3. After that, React runs the effects. Here's the problem: if the effect immediately updates state, React will restart this whole cycle, leading to many unnecessary renders.

This means you should avoid mutating state inside an effect, and in particular, not mutate state inside an effect whose dependency array contains that same state.


There are many more helpful examples on the official [React documentation page](https://react.dev/learn/you-might-not-need-an-effect).



## Useful reads
- [Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure)
- [Thinking in React](https://react.dev/learn/thinking-in-react)
- [You Might Not Need an Effect](https://react.dev/learn/you-might-not-need-an-effect)