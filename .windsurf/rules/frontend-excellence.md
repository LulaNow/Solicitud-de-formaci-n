# Frontend Excellence Rules

## Design Philosophy

**Frontend is not just UI—it's system design.** Every component decision affects performance, maintainability, and user experience.

## Core Principles

### Performance First
- **Measure, don't assume**: Profile before optimizing
- **State is expensive, props are cheap**: Lift state only when necessary
- **Simplicity over cleverness**: Clear code beats smart code
- **Eliminate waterfalls**: Parallel data fetching is mandatory
- **Bundle size matters**: Keep main bundle < 200KB

### Accessibility is Non-Negotiable
- If it's not accessible, it's broken
- Keyboard navigation must work
- Screen readers must announce correctly
- Focus management is required

### Type Safety
- TypeScript strict mode always
- No `any` types
- Proper generics for reusable components
- Let TypeScript infer when possible

### Mobile-First
- Design for smallest screen first
- Responsive by default
- Touch-friendly interactions

## Design Decisions

### Before Creating Components

1. **Is this reusable or one-off?**
   - One-off → Keep co-located with usage
   - Reusable → Extract to components directory

2. **Does state belong here?**
   - Component-specific → Local state (useState)
   - Shared across tree → Lift or use Context
   - Server data → React Query / TanStack Query

3. **Will this cause re-renders?**
   - Static content → Server Component (Next.js)
   - Client interactivity → Client Component with React.memo if needed
   - Expensive computation → useMemo / useCallback

4. **Is this accessible by default?**
   - Keyboard navigation works
   - Screen reader announces correctly
   - Focus management handled

## State Management Hierarchy

1. **Server State** → React Query / TanStack Query (caching, refetching)
2. **URL State** → searchParams (shareable, bookmarkable)
3. **Global State** → Zustand (rarely needed)
4. **Context** → When state is shared but not global
5. **Local State** → Default choice

## Rendering Strategy (Next.js)

- **Static Content** → Server Component (default)
- **User Interaction** → Client Component
- **Dynamic Data** → Server Component with async/await
- **Real-time Updates** → Client Component + Server Actions

## What You MUST Do

✅ Build components with single responsibility
✅ Use TypeScript strict mode (no `any`)
✅ Implement proper error boundaries
✅ Handle loading and error states gracefully
✅ Write accessible HTML (semantic tags, ARIA)
✅ Extract reusable logic into custom hooks
✅ Test critical components

## What You MUST NOT Do

❌ Don't over-abstract prematurely
❌ Don't use prop drilling when Context is clearer
❌ Don't optimize without profiling first
❌ Don't ignore accessibility as "nice to have"
❌ Don't use class components (hooks are standard)
❌ Don't wrap everything in React.memo (premature optimization)
❌ Don't cache without measuring (useMemo/useCallback)

## Design Anti-Patterns to Avoid

❌ **NO Generic/Template Designs**: Every design must be unique and memorable
❌ **NO Purple by Default**: Purple is AI cliché, avoid unless explicitly requested
❌ **NO Standard Layouts**: Break the "Left Text / Right Visual" habit
❌ **NO Bento Grids by Default**: Use only for truly complex data
❌ **NO Glassmorphism Abuse**: Solid colors and raw borders preferred
❌ **NO Static Designs**: UI must feel alive with animations

## Animation Requirements

- **Mandatory scroll-triggered animations** for main sections
- **Micro-interactions** for all clickable elements
- **Spring physics** for organic feel
- **GPU-accelerated properties only** (transform, opacity)
- **prefers-reduced-motion support** is mandatory

## Quality Control Loop

After editing any file:

1. Run validation: `npm run lint && npx tsc --noEmit`
2. Fix all errors: TypeScript and linting must pass
3. Verify functionality: Test the change works
4. Report complete: Only after quality checks pass

## Review Checklist

- [ ] TypeScript: Strict mode compliant, no `any`
- [ ] Performance: Profiled before optimization
- [ ] Accessibility: ARIA labels, keyboard navigation, semantic HTML
- [ ] Responsive: Mobile-first, tested on breakpoints
- [ ] Error Handling: Error boundaries, graceful fallbacks
- [ ] Loading States: Skeletons or spinners for async operations
- [ ] State Strategy: Appropriate choice (local/server/global)
- [ ] Server Components: Used where possible (Next.js)
- [ ] Tests: Critical logic covered
- [ ] Linting: No errors or warnings
