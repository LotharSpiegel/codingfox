+++
title = 'The Callback That Re-rendered an Entire Table'
date = 2026-07-31T00:00:00+02:00
draft = false
tags = ['react', 'frontend', 'memoization', 'usecallback']
+++

*A short debugging story about `React.memo`, prop drilling, and a missing `useCallback`.*

## The symptom

We had an editable table: one row per item, each row with a couple of text inputs. Every row component was wrapped in `React.memo`, specifically so that typing in one row wouldn't force every other row to re-render. On a table with dozens of rows, that matters — otherwise every keystroke re-renders the whole table.

It didn't work. Typing a single character in one row's input made *every* row re-render, every time.

The frustrating part: on paper, the memoization looked correct. The row's own data hadn't changed. The value being edited in *other* rows hadn't changed. And yet, all of them re-rendered anyway.

## Step 1: See it, don't guess it

Before touching any code, confirm the symptom visually. The React Developer Tools browser extension has a setting for exactly this:

1. Install **React Developer Tools** (Chrome/Firefox/Edge).
2. Open DevTools → the **Components** tab (next to Elements/Console).
3. Click the gear icon (Settings) → check **"Highlight updates when components render"**.
4. Go back to the app and type into one input.

Every component that actually re-renders flashes a colored outline for a moment. If you see only the one row you're editing flash, memoization is working. If the whole table flashes on every keystroke, something is invalidating it — and now you have visual proof instead of a hunch.

There's also a more detailed tool for the same job: the **Profiler** tab in React DevTools. Hit record, type a character, stop recording, and it shows you a flame graph of exactly which components rendered during that one commit, plus (in recent versions) *why* — which prop, state, or context changed.

## Step 2: The mental model

`React.memo` wraps a component and adds one rule: *before re-rendering, compare the new props to the previous props. If every prop is the same (by `===`), skip the render entirely.*

The comparison is shallow, meaning each prop is compared individually using === (rather than recursively comparing nested objects or arrays).

Here's the simplified shape of what we had — a parent holding the edited values, and a memoized row per item:

{{< highlight tsx >}}
import { memo, useState } from 'react';

type Item = {
  id: string;
  label: string;
};

type TableProps = {
  items: Item[];
};

function Table({ items }: TableProps) {
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  const handleChange = (id: string, value: string) => {
    setEditedValues(prev => ({ ...prev, [id]: value }));
  };

  return (
    <table>
      {items.map(item => (
        <MemoizedRow
          key={item.id}
          item={item}
          value={editedValues[item.id]}
          onChange={handleChange}
        />
      ))}
    </table>
  );
}

type RowProps = {
  item: Item;
  value: string | undefined;
  onChange: (id: string, value: string) => void;
};

function Row({ item, value, onChange }: RowProps) {
  return (
    <tr>
      <td>{item.label}</td>
      <td>
        <input value={value ?? ''} onChange={e => onChange(item.id, e.target.value)} />
      </td>
    </tr>
  );
}

const MemoizedRow = memo(Row);
{{< /highlight >}}

Notice what each `Row` receives: `item` (doesn't change while typing), `value` (only changes for *its own* row), and `onChange`.

For an untouched row, `item` is the same object reference, `value` is the same string — so far, so good. `memo` should skip it.

## Step 3: The prop that ruins it for everyone

`handleChange` is defined directly in the component body. Every time `Table` re-renders — which happens on *every keystroke*, because that's where the edited state lives — a brand-new `handleChange` function is created. Different function, different reference, `===` says "different."

Every single `Row` receives that same `onChange` prop. It doesn't matter that row #7's `item` and `value` are untouched — its `onChange` prop is a new function object on every render, so `memo`'s comparison fails, and row #7 re-renders too. So does every other row. The one prop that's shared identically across the whole list becomes the single point of failure for the whole list's memoization.

This is the key insight, and it's easy to miss: **an unstable prop shared by every item in a list has a blast radius of the entire list**, not just the item you're editing. A stable `item` and a stable `value` don't save you if `onChange` resets every render.

## Step 4: The fix

Wrap the handler in `useCallback` with an empty dependency array, so the *same* function reference survives across renders of `Table`:

{{< highlight tsx >}}
import { useCallback } from 'react';

const handleChange = useCallback((id: string, value: string) => {
  setEditedValues(prev => ({ ...prev, [id]: value }));
}, []);
{{< /highlight >}}

`setEditedValues` (a `useState` setter) is always stable, so there's nothing else the callback needs to depend on. Now `onChange` is `===` across renders, `memo`'s shallow comparison passes for every untouched row, and only the row you're actually typing in re-renders.

## How to pin down *which* prop is the culprit

Highlighting updates tells you *that* something re-renders. To find out *which prop* broke the comparison, `memo` accepts a second argument — a custom comparator — which is a convenient place to drop a temporary log:

{{< highlight tsx >}}
function Row({ item, value, onChange }: RowProps) { /* ... */ }

const MemoizedRow = memo(Row, (prev, next) => {
  const same = {
    item: prev.item === next.item,
    value: prev.value === next.value,
    onChange: prev.onChange === next.onChange,
  };
  console.log('Row', next.item.id, same);
  return Object.values(same).every(Boolean);
});
{{< /highlight >}}

Type a character, watch the log. Any `false` next to a prop you *expected* to be stable is your lead. In our case, `onChange` came back `false` on every render, for every row — which is exactly what pointed at the missing `useCallback`.

## Takeaways

- `React.memo` only helps if *every* prop you pass is actually stable across renders — objects, arrays, and functions included.
- A prop that's identical across every item in a list (a shared callback, a shared config object) is the highest-risk one: instability there defeats memoization for the *entire* list, not just the item being edited.
- Don't reason about this in the abstract for too long — "Highlight updates when components render" in React DevTools gives you a yes/no answer in ten seconds, and a custom `memo` comparator with a log statement tells you exactly which prop to fix.
