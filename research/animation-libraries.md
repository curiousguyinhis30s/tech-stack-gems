# React Animation Libraries - 2025 Research

*Generated via GLM parallel research*

## Comparison Table

| Library | Hackability | Bundle Size | Performance | API Complexity | Best For |
|:--------|:-----------:|:-----------:|:-----------:|:--------------:|:---------|
| **Framer Motion** | **9/10** | ~45 KB | ⭐⭐⭐⭐ | Medium | UI interactions, gestures, layouts |
| **GSAP** | **10/10** | ~62 KB | ⭐⭐⭐⭐⭐ | High | Award-winning sites, scrollytelling |
| **Motion One** | **7/10** | ~2.8 KB | ⭐⭐⭐⭐⭐ | Low | Performance-critical, micro-interactions |
| **React Spring** | **8/10** | ~22 KB | ⭐⭐⭐ | High | Physics-based, organic movement |
| **Auto-Animate** | **3/10** | ~1.4 KB | ⭐⭐⭐⭐ | Very Low | Layout transitions (FLIP) |

---

## Tier 1: The Industry Standard

### Framer Motion (9/10)
```tsx
import { motion, AnimatePresence } from 'framer-motion'

// Simple animation
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0 }}
  transition={{ type: 'spring', stiffness: 300 }}
>
  Hello
</motion.div>

// Layout animations
<motion.div layout>
  {items.map(item => (
    <motion.div key={item.id} layout />
  ))}
</motion.div>
```

**Use when:** You want it to "just work" with deep customization available

---

## Tier 2: Performance Kings

### Motion One (7/10) - 2.8 KB
```tsx
import { animate } from 'motion'
import { useRef, useEffect } from 'react'

function FadeIn({ children }) {
  const ref = useRef()

  useEffect(() => {
    animate(ref.current,
      { opacity: [0, 1], y: [20, 0] },
      { duration: 0.5, easing: 'ease-out' }
    )
  }, [])

  return <div ref={ref}>{children}</div>
}
```

**Use when:** Every KB counts, native WAAPI performance

### Auto-Animate (3/10) - 1.4 KB
```tsx
import { useAutoAnimate } from '@formkit/auto-animate/react'

function List() {
  const [parent] = useAutoAnimate()

  return (
    <ul ref={parent}>
      {items.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  )
}
```

**Use when:** Zero-config layout animations for lists/grids

---

## Tier 3: Maximum Power

### GSAP (10/10)
```tsx
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

function HeroAnimation() {
  useGSAP(() => {
    gsap.timeline()
      .from('.hero-title', { y: 100, opacity: 0, duration: 1 })
      .from('.hero-subtitle', { y: 50, opacity: 0, duration: 0.8 }, '-=0.5')
      .from('.cta-button', { scale: 0, ease: 'back.out(1.7)' }, '-=0.3')
  })

  return (
    <div>
      <h1 className="hero-title">Welcome</h1>
      <p className="hero-subtitle">The best animations</p>
      <button className="cta-button">Get Started</button>
    </div>
  )
}
```

**Use when:** Complex timelines, scroll-driven animations, WebGL

---

## Recommended Stack

```
Animation Stack:
├── Framer Motion ──────── Primary (UI interactions)
├── Auto-Animate ──────── Lists/grids (zero config)
├── Motion One ────────── Micro-interactions (performance)
└── GSAP ──────────────── Landing pages (when needed)
```

### Installation

```bash
# Primary
npm install framer-motion

# Zero-config lists
npm install @formkit/auto-animate

# Performance-critical
npm install motion

# Heavy lifting (optional)
npm install gsap @gsap/react
```

---

## Performance Tips

1. **Use `will-change`** sparingly
2. **Prefer `transform`** over position properties
3. **Use `AnimatePresence`** for exit animations
4. **Avoid animating `height: auto`** - use `max-height` or layout animation
5. **Batch animations** with `stagger` patterns

---

## Final Verdict

| Use Case | Best Choice |
|----------|-------------|
| General UI animations | **Framer Motion** |
| List/grid transitions | **Auto-Animate** |
| Performance-critical | **Motion One** |
| Award-winning sites | **GSAP** |
| Physics-based movement | **React Spring** |
