# Thesys.dev - Server-Driven UI Analysis

*Generated via GLM research*

## Summary
**The System** is a Server-Driven UI (SDUI) engine. Instead of hardcoding UI in apps, the app asks The System for a JSON schema that dictates components, layouts, styles, and data bindings.

**Hackability Score: 7/10**

## How It Works

```
Traditional Flow:
App Code → Hardcoded UI → Deploy to App Store

SDUI Flow:
App Code → Register Components → Fetch Schema from Thesys → Render Dynamically
```

1. **Schema Definition**: Define primitives (Button, Card, List) in client code
2. **The Builder**: Visual builder or JSON to assemble screens
3. **The Engine**: Returns JSON tree describing View + Data hierarchy
4. **Runtime Rendering**: SDK parses JSON, renders native components

## Hackability Assessment

### Why 7/10:
**Strengths:**
- Architecture agnostic (React, React Native, Flutter, Swift, Kotlin)
- Dynamic data binding (change what/where data displays)
- Action chaining (trigger logic, navigation, API calls)
- No app store deploy needed for UI changes

**Limitations:**
- Can't render components not registered in SDK
- Proprietary schema format (vendor lock-in risk)
- SaaS only - not self-hosted

## Use Cases

| Use Case | Description |
|----------|-------------|
| A/B Testing | Marketing changes layouts without devs |
| Remote Config | Turn features on/off instantly |
| Content Apps | News, e-commerce with changing structures |
| White-Labeling | Multiple app skins, same binary |
| PWA Prototyping | Rapid user flow iteration |

## Comparison

| Feature | Thesys.dev | Builder.io | Firebase Remote Config |
|---------|------------|------------|------------------------|
| UI Granularity | High (Entire Trees) | Medium (Sections) | Low (Flags) |
| Data Binding | Built-in | Visual | None |
| Open Source | No (SaaS) | Partial | No |
| Self-Hosted | ❌ No | ✅ Yes | ❌ No |

## Our Verdict

**Good for:**
- Teams needing fast UI iteration
- Apps with frequently changing layouts
- Remote content management

**Not good for:**
- Teams wanting self-hosted control
- Projects avoiding vendor lock-in
- Complex custom component needs

## Alternative: Build Your Own SDUI

If we want 10/10 hackability, we can build our own SDUI system:

```typescript
// Component Registry
const components = {
  'text': TextComponent,
  'button': ButtonComponent,
  'card': CardComponent,
  'list': ListComponent,
}

// Schema Fetcher
async function fetchScreen(screenId: string) {
  const response = await fetch(`/api/screens/${screenId}`);
  return response.json();
}

// Renderer
function DynamicScreen({ schema }) {
  if (!schema) return null;

  const Component = components[schema.type];
  if (!Component) return null;

  return (
    <Component {...schema.props}>
      {schema.children?.map((child, i) => (
        <DynamicScreen key={i} schema={child} />
      ))}
    </Component>
  );
}
```

## Integration with Our Stack

Thesys could be useful for:
- **yes.my landing pages** - Marketing can iterate without deploys
- **hendshake UI flows** - A/B test onboarding
- **Mobile apps** - Skip app store for UI changes

However, given our "hackable everything" philosophy, building a self-hosted SDUI layer on top of our stack might be more aligned with our goals.
