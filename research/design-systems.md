# React UI Component Libraries - 2025 Research

*Generated via GLM parallel research*

## The Paradigm Shift
2025 moved away from heavy component libraries (Material UI, Ant Design) toward **Unstyled/Headless** libraries.

Key distinction:
- **Radix/Headless UI**: Installed as dependencies
- **shadcn/ui**: NOT a library - it's a code registry you copy-paste

---

## Comparison Table

| Library | Hackability | Bundle Size | Accessibility | Customization | Learning Curve |
|:--------|:-----------:|:-----------:|:-------------:|:-------------:|:--------------:|
| **shadcn/ui** | **10/10** | Zero (copied) | ⭐⭐⭐⭐⭐ | Maximum | Medium |
| **Ark UI** | **9/10** | Tiny (tree-shake) | ⭐⭐⭐⭐⭐ | High (slots) | Medium-High |
| **Radix UI** | **7/10** | Tiny (tree-shake) | ⭐⭐⭐⭐⭐ | High (CSS) | Medium-High |
| **Headless UI** | **6/10** | Tiny (tree-shake) | ⭐⭐⭐⭐ | Medium | Low |

---

## The Winner: shadcn/ui (10/10)

### Why shadcn/ui Wins for Hackable Projects

```bash
# Not npm install - you COPY the code
npx shadcn-ui@latest add button
```

**Benefits:**
- Code lives in YOUR repo
- Change dropdown animation? Just edit the file
- No fighting library override systems
- Zero runtime dependencies
- Built on Radix + Tailwind

### Installation for Our Stack

```bash
# Initialize shadcn/ui
npx shadcn-ui@latest init

# Add components as needed
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add toast
```

---

## The Dark Horse: Ark UI (9/10)

If you MUST have a dependency model:

```tsx
// Ark UI - Slot-based composition
import { Dialog } from '@ark-ui/react'

<Dialog.Root>
  <Dialog.Trigger asChild>
    <button>Open</button>
  </Dialog.Trigger>
  <Dialog.Backdrop />
  <Dialog.Positioner>
    <Dialog.Content>
      <Dialog.Title>Hello</Dialog.Title>
      <Dialog.Description>Ark UI rocks</Dialog.Description>
      <Dialog.CloseTrigger />
    </Dialog.Content>
  </Dialog.Positioner>
</Dialog.Root>
```

**Why Ark:**
- Supports React, Solid, Vue
- Incredible slot-based customization
- Change HTML structure while keeping logic
- Rising star from Chakra team

---

## Component Stack Recommendation

```
Design System Stack:
├── shadcn/ui (10/10) ─────── Base components
├── Radix Primitives (7/10) ── Under the hood of shadcn
├── Tailwind CSS ──────────── Styling
├── CVA (class-variance-authority) ── Variants
└── Lucide Icons ──────────── Icons
```

### packages.json additions:
```json
{
  "dependencies": {
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.300.0"
  }
}
```

---

## File Structure (shadcn/ui)

```
src/
├── components/
│   └── ui/           # shadcn components live here
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       └── ...
├── lib/
│   └── utils.ts      # cn() helper function
└── styles/
    └── globals.css   # Tailwind + shadcn vars
```

---

## Final Verdict

| Need | Choice |
|------|--------|
| Maximum hackability | **shadcn/ui** |
| Dependency model preferred | **Ark UI** |
| Quick prototyping (Tailwind) | **Headless UI** |
| Foundation for custom system | **Radix UI** |
