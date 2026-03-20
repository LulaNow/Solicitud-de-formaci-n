# Performance Optimization Rules

## Philosophy

**Eliminate waterfalls first, optimize bundles second, then micro-optimize.**

Performance is measured, not assumed. Always profile before optimizing.

## Critical Optimizations (Do First)

### 1. Eliminate Waterfalls

**Impact**: Each waterfall adds 100-500ms+ latency

```typescript
// ❌ BAD: Sequential waterfalls
async function loadUserDashboard(userId: string) {
  const user = await fetchUser(userId);
  const posts = await fetchPosts(user.id);
  const comments = await fetchComments(user.id);
  return { user, posts, comments };
}

// ✅ GOOD: Parallel fetching
async function loadUserDashboard(userId: string) {
  const [user, posts, comments] = await Promise.all([
    fetchUser(userId),
    fetchPosts(userId),
    fetchComments(userId)
  ]);
  return { user, posts, comments };
}
```

### 2. Bundle Size Optimization

**Impact**: Directly affects Time to Interactive, Largest Contentful Paint

**Target**: Main bundle < 200KB

```typescript
// ❌ BAD: Import entire library
import _ from 'lodash';
const result = _.debounce(fn, 300);

// ✅ GOOD: Import specific function
import debounce from 'lodash/debounce';
const result = debounce(fn, 300);

// ✅ BETTER: Use native or lightweight alternative
const debounce = (fn, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
};
```

### 3. Dynamic Imports

```typescript
// ❌ BAD: Import heavy component directly
import HeavyChart from './HeavyChart';

function Dashboard() {
  return <HeavyChart data={data} />;
}

// ✅ GOOD: Lazy load heavy components
import { lazy, Suspense } from 'react';

const HeavyChart = lazy(() => import('./HeavyChart'));

function Dashboard() {
  return (
    <Suspense fallback={<ChartSkeleton />}>
      <HeavyChart data={data} />
    </Suspense>
  );
}
```

## Server-Side Performance

### Parallel Server Fetching

```typescript
// ✅ GOOD: Next.js Server Component with parallel fetching
async function UserPage({ params }: { params: { id: string } }) {
  const [user, posts, followers] = await Promise.all([
    db.user.findUnique({ where: { id: params.id } }),
    db.post.findMany({ where: { userId: params.id } }),
    db.follow.count({ where: { followingId: params.id } })
  ]);
  
  return <UserProfile user={user} posts={posts} followers={followers} />;
}
```

### API Route Optimization

```typescript
// ❌ BAD: N+1 query problem
async function getPosts() {
  const posts = await db.post.findMany();
  
  for (const post of posts) {
    post.author = await db.user.findUnique({ where: { id: post.authorId } });
  }
  
  return posts;
}

// ✅ GOOD: Single query with include
async function getPosts() {
  return await db.post.findMany({
    include: {
      author: true
    }
  });
}
```

## React Performance

### Re-render Optimization

```typescript
// ✅ GOOD: Memoize expensive computations
function DataTable({ data, filters }: Props) {
  const filteredData = useMemo(() => {
    return data.filter(item => 
      Object.entries(filters).every(([key, value]) => 
        item[key] === value
      )
    );
  }, [data, filters]);
  
  return <Table data={filteredData} />;
}

// ✅ GOOD: Prevent unnecessary re-renders
const TableRow = memo(({ item }: { item: Item }) => {
  return <tr>{/* ... */}</tr>;
});
```

### Callback Optimization

```typescript
// ❌ BAD: New function on every render
function Parent() {
  return <Child onClick={() => handleClick()} />;
}

// ✅ GOOD: Stable callback reference
function Parent() {
  const handleClick = useCallback(() => {
    // Handle click
  }, []);
  
  return <Child onClick={handleClick} />;
}
```

## Image Optimization

### Next.js Image Component

```typescript
// ✅ GOOD: Optimized images
import Image from 'next/image';

function ProductCard({ product }: Props) {
  return (
    <Image
      src={product.imageUrl}
      alt={product.name}
      width={400}
      height={300}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      priority={product.featured}
    />
  );
}
```

### Lazy Loading Images

```typescript
// ✅ GOOD: Native lazy loading
<img 
  src={imageUrl} 
  alt={alt}
  loading="lazy"
  decoding="async"
/>
```

## List Virtualization

```typescript
// ✅ GOOD: Virtualize long lists (>100 items)
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  });
  
  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index].name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Caching Strategies

### React Query / TanStack Query

```typescript
// ✅ GOOD: Automatic caching and deduplication
import { useQuery } from '@tanstack/react-query';

function UserProfile({ userId }: Props) {
  const { data: user, isLoading } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
  
  if (isLoading) return <Skeleton />;
  return <Profile user={user} />;
}
```

### Service Worker Caching

```typescript
// ✅ GOOD: Cache static assets
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

## Performance Monitoring

### Web Vitals

```typescript
// ✅ GOOD: Monitor Core Web Vitals
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric: Metric) {
  const body = JSON.stringify(metric);
  const url = '/api/analytics';
  
  if (navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, { body, method: 'POST', keepalive: true });
  }
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

## Performance Budget

### Bundle Size Limits

- **Main bundle**: < 200KB (gzipped)
- **Route bundles**: < 100KB each
- **Vendor bundle**: < 150KB
- **Total initial load**: < 500KB

### Performance Metrics

- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

## Optimization Checklist

Before deploying:

- [ ] No sequential data fetching (waterfalls eliminated)
- [ ] Bundle size < 200KB for main bundle
- [ ] No barrel imports in app code
- [ ] Dynamic imports used for large components
- [ ] Parallel data fetching where possible
- [ ] Server components used where appropriate
- [ ] API routes optimized (no N+1 queries)
- [ ] Suspense boundaries for data fetching
- [ ] Expensive computations memoized
- [ ] List rendering virtualized (if > 100 items)
- [ ] Images optimized with next/image
- [ ] No unnecessary re-renders
- [ ] Hot path loops optimized
- [ ] Web Vitals monitored

## Common Performance Anti-Patterns

❌ **Sequential awaits**: Use Promise.all() for independent operations
❌ **Importing entire libraries**: Import specific functions
❌ **Barrel exports**: Import directly from source files
❌ **No code splitting**: Use dynamic imports for heavy components
❌ **Client-side data fetching without caching**: Use React Query
❌ **Unnecessary re-renders**: Use React.memo, useMemo, useCallback
❌ **Large images**: Optimize and use next/image
❌ **Long lists without virtualization**: Use virtual scrolling
❌ **No performance monitoring**: Track Web Vitals
❌ **Premature optimization**: Measure first, then optimize

## Performance Testing

```bash
# Lighthouse CI
npm run build
npx lighthouse http://localhost:3000 --view

# Bundle analysis
npm run build
npx @next/bundle-analyzer

# Performance profiling
# Use React DevTools Profiler
# Use Chrome DevTools Performance tab
```

## Remember

1. **Measure first** - Use profiling tools
2. **Biggest impact first** - Waterfalls → Bundle → Server → Micro
3. **Don't over-optimize** - Focus on real bottlenecks
4. **Use platform features** - Next.js has optimizations built-in
5. **Think about users** - Real-world conditions matter
