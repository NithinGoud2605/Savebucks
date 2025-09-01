# @app/ui – Design-System Component Library

> **Status:** Experimental → Expect breaking changes until v1.0.0

---

## Motivation

This package centralises all cross-app UI primitives (buttons, cards, modals, etc.) so that web, admin, and mobile surfaces share a single source-of-truth for look-and-feel as well as behaviour.  Consolidating UI logic yields:

1. **Consistency** – no more divergent button styles between screens.
2. **Velocity** – build once, ship everywhere.
3. **Quality** – battle-test the same component across multiple contexts.
4. **Theming** – one place to toggle brand colours or typography (if re-enabled later).

## Installation

```bash
pnpm add @app/ui
# or
npm install @app/ui
# or
yarn add @app/ui
```

## Usage

```jsx
import { Button, Card } from '@app/ui'

export default function Example() {
  return (
    <Card className="max-w-sm mx-auto mt-12 p-6 space-y-4">
      <h3 className="text-xl font-semibold">Reusable UI!</h3>
      <p className="text-secondary-700">All screens now share the same design primitives.</p>
      <Button variant="primary">Click me</Button>
    </Card>
  )
}
```

## Component Catalogue

| Component | Status | Description |
|-----------|--------|-------------|
| `Button`  | ✅ Stable | All purpose button with variants (`primary`, `secondary`, `outline`, `ghost`, `gradient`, etc.) |
| `IconButton` | ✅ Stable | Circular icon-only button useful for toolbars |
| `FloatingActionButton` | ✅ Stable | Prominent action button for mobile contexts |
| `Card` | ✅ Stable | Surface container with elevation, gradient, or outline variants |
| `Badge` | ✅ Stable | Small inline status labels |
| `Icon` | ✅ Stable | Unified icon wrapper around Lucide + Heroicons |
| `Input` | ⚠️ Beta | Form input with validation states |
| `Modal` | ⚠️ Beta | Accessible dialog layer |
| `Toast` | ⚠️ Beta | Non-blocking notification banner |
| `LoadingIcon` | ✅ Stable | Spinning loader icon |

> **Legend**  
> ✅ Stable – safe for production  
> ⚠️ Beta – API may change  
> ⏳ Planned – not yet implemented

## Development

This package simply re-exports sources that currently live inside `apps/web/src/components/ui`.  In a later refactor we’ll physically move those files here, but keeping them in place for now avoids noisy import rewrites while still letting other workspaces depend on the package.

### Local linking

Because we’re inside a monorepo managed by pnpm, running `pnpm i` at repo root automatically links `@app/ui` so other packages can import it without additional steps.

### Testing

Unit tests live alongside component files.  Run them via:

```bash
pnpm test --filter @app/ui
```

Visual tests run inside Storybook (planned for Phase 7).

---

## Changelog

### 0.1.0 – Initial extraction (YYYY-MM-DD)

* Created package with `package.json` and `README`.
* Re-exported existing UI primitives from `apps/web`.
* No functional changes.

---

## License

MIT © Your Company Name