# Windsurf Superpowers Architecture

> Converted from Antigravity Kit - Enhanced AI Agent Capability System

---

## 📋 Overview

This workspace is powered by a comprehensive system of:

- **8 Core Workflows** - Slash command procedures
- **4 Global Rules** - System-wide standards
- **Advanced Skills** - Embedded in workflows and rules

---

## 🏗️ Directory Structure

```plaintext
.windsurf/
├── ARCHITECTURE.md          # This file
├── workflows/               # 8 Slash Commands
│   ├── brainstorm.md
│   ├── create.md
│   ├── debug.md
│   ├── deploy.md
│   ├── enhance.md
│   ├── orchestrate.md
│   ├── plan.md
│   ├── status.md
│   ├── test.md
│   └── ui-ux-pro-max.md
└── rules/                   # 4 Global Rules
    ├── frontend-excellence.md
    ├── code-quality.md
    ├── security-first.md
    └── performance-optimization.md
```

---

## 🔄 Workflows (8)

Slash command procedures. Invoke with `/command`.

| Command | Description | Auto-run |
|---------|-------------|----------|
| `/brainstorm` | Socratic discovery, explore options | No |
| `/create` | Create new applications/features | Partial (turbo) |
| `/debug` | Systematic problem investigation | No |
| `/deploy` | Deploy to production/staging | Partial (turbo) |
| `/enhance` | Improve existing code | No |
| `/orchestrate` | Multi-domain coordination | No |
| `/plan` | Task breakdown and planning | No |
| `/status` | Project health check | Partial (turbo) |
| `/test` | Testing and quality assurance | Partial (turbo) |
| `/ui-ux-pro-max` | Premium UI/UX design | No |

---

## 📜 Global Rules (4)

System-wide standards that always apply.

| Rule | Focus | Key Principles |
|------|-------|----------------|
| `frontend-excellence.md` | Frontend architecture | Performance-first, accessibility, type safety |
| `code-quality.md` | Clean code standards | Naming, testing, error handling |
| `security-first.md` | Security practices | Auth, validation, encryption |
| `performance-optimization.md` | Performance | Eliminate waterfalls, optimize bundles |

---

## 🎯 Core Capabilities

### Frontend Development
- **React/Next.js expertise** with performance optimization
- **Design systems** with anti-cliché enforcement
- **Accessibility-first** approach
- **Animation & visual depth** requirements
- **No generic designs** - memorable UI/UX

### Backend Development
- **API design** (REST, GraphQL, tRPC)
- **Database optimization** (Prisma, SQL)
- **Security best practices** (OWASP Top 10)
- **Performance** (eliminate N+1 queries)

### Testing & Quality
- **Unit, integration, E2E** testing
- **Test coverage goals** (critical paths 100%)
- **Quality control loops** (lint, TypeScript, tests)

### DevOps & Deployment
- **CI/CD pipelines**
- **Docker containerization**
- **Platform deployment** (Vercel, Netlify, AWS)
- **Monitoring & logging**

### Security
- **Authentication & authorization**
- **Input validation & sanitization**
- **SQL injection prevention**
- **XSS protection**
- **Security headers**

### Performance
- **Waterfall elimination**
- **Bundle size optimization** (< 200KB)
- **Server-side optimization**
- **Caching strategies**
- **Web Vitals monitoring**

---

## 🚀 Quick Start

### For New Projects

```bash
# Use /create workflow
/create [project description]

# Or use /plan first for complex projects
/plan [project description]
```

### For Existing Projects

```bash
# Check project health
/status

# Improve code
/enhance [what to improve]

# Debug issues
/debug [issue description]

# Deploy
/deploy
```

### For Design Work

```bash
# Premium UI/UX design
/ui-ux-pro-max [design request]

# Explore options first
/brainstorm [design challenge]
```

---

## 🎨 Design Philosophy

### Frontend Excellence
- **Performance is measured, not assumed**
- **State is expensive, props are cheap**
- **Simplicity over cleverness**
- **Accessibility is non-negotiable**
- **Type safety prevents bugs**
- **Mobile-first always**

### Design Anti-Patterns (Forbidden)
- ❌ Generic/template designs
- ❌ Purple by default (AI cliché)
- ❌ Standard layouts (Left Text / Right Visual)
- ❌ Bento grids by default
- ❌ Glassmorphism abuse
- ❌ Static designs (animation mandatory)

### Code Quality
- **Single responsibility** functions
- **TypeScript strict mode** (no `any`)
- **Error boundaries** and graceful fallbacks
- **Test critical paths** (100% coverage)
- **Clean, self-documenting** code

### Security First
- **Defense in depth**
- **Never trust user input**
- **Validate on both client and server**
- **Assume breach mentality**
- **Least privilege principle**

### Performance Optimization
- **Eliminate waterfalls first**
- **Optimize bundles second**
- **Then micro-optimize**
- **Always measure before optimizing**

---

## 📊 Quality Standards

### Performance Metrics
- **Main bundle**: < 200KB (gzipped)
- **First Contentful Paint (FCP)**: < 1.8s
- **Largest Contentful Paint (LCP)**: < 2.5s
- **Time to Interactive (TTI)**: < 3.8s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1

### Test Coverage Goals
- **Critical paths**: 100% coverage
- **Business logic**: 90%+ coverage
- **UI components**: 80%+ coverage
- **Utilities**: 95%+ coverage

### Code Quality Checks
- [ ] No TypeScript errors
- [ ] No linting warnings
- [ ] All tests passing
- [ ] Security scan passed
- [ ] Performance benchmarks met

---

## 🔗 Workflow Integration

### Typical Development Flow

1. **Planning Phase**
   ```bash
   /plan [project]
   # or
   /brainstorm [challenge]
   ```

2. **Development Phase**
   ```bash
   /create [feature]
   # or
   /enhance [existing code]
   ```

3. **Quality Assurance**
   ```bash
   /test
   /status
   ```

4. **Deployment**
   ```bash
   /deploy
   ```

### Complex Tasks

```bash
# Use orchestration for multi-domain tasks
/orchestrate [complex task requiring multiple perspectives]
```

---

## 🛡️ Security Checklist

Before deploying:

- [ ] All user inputs validated and sanitized
- [ ] SQL injection prevention implemented
- [ ] XSS protection in place
- [ ] CSRF tokens for state-changing operations
- [ ] Authentication and authorization working
- [ ] Passwords properly hashed (bcrypt, argon2)
- [ ] Secrets in environment variables, not code
- [ ] HTTPS enforced in production
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] Dependencies scanned for vulnerabilities

---

## 📈 Performance Checklist

Before deploying:

- [ ] No sequential data fetching (waterfalls eliminated)
- [ ] Bundle size < 200KB for main bundle
- [ ] No barrel imports in app code
- [ ] Dynamic imports used for large components
- [ ] Parallel data fetching where possible
- [ ] Server components used where appropriate
- [ ] API routes optimized (no N+1 queries)
- [ ] Expensive computations memoized
- [ ] Images optimized
- [ ] Web Vitals monitored

---

## 🎯 Best Practices

### Always
- ✅ Measure before optimizing
- ✅ Write tests for critical paths
- ✅ Handle errors gracefully
- ✅ Use TypeScript strict mode
- ✅ Follow accessibility standards
- ✅ Create memorable, unique designs
- ✅ Validate all user inputs
- ✅ Monitor performance metrics

### Never
- ❌ Assume performance without measuring
- ❌ Use `any` type in TypeScript
- ❌ Ignore accessibility
- ❌ Create generic/template designs
- ❌ Trust user input without validation
- ❌ Deploy without testing
- ❌ Optimize prematurely
- ❌ Commit secrets to code

---

## 📚 Migration from Antigravity

This system is converted from **Antigravity Kit** with the following enhancements:

### What's Preserved
- ✅ All core workflows (brainstorm, create, debug, etc.)
- ✅ Design philosophy (anti-cliché, performance-first)
- ✅ Security standards (OWASP Top 10)
- ✅ Performance optimization rules (Vercel Engineering)
- ✅ Code quality standards

### What's Enhanced
- 🚀 Native Windsurf workflow format
- 🚀 Turbo annotations for safe auto-run
- 🚀 Integrated global rules
- 🚀 Streamlined architecture
- 🚀 Better organization

### What's Different
- Agents → Embedded in workflows and rules
- Skills → Integrated into workflows
- MCP servers → Configure separately in Windsurf settings

---

## 🔧 Customization

### Adding New Workflows

Create new file in `.windsurf/workflows/`:

```markdown
---
description: Brief description of workflow
---

# /command-name - Title

## Purpose
[What this workflow does]

## Steps
[Numbered steps]

// turbo (optional - for safe auto-run steps)
```

### Adding New Rules

Create new file in `.windsurf/rules/`:

```markdown
# Rule Name

## Core Principles
[Key principles]

## Standards
[Specific standards]

## Checklist
[Verification checklist]
```

---

## 📞 Support

For issues or questions:
1. Check `/status` for project health
2. Use `/debug` for systematic investigation
3. Use `/brainstorm` to explore solutions
4. Use `/orchestrate` for complex multi-domain issues

---

**Remember**: This system is designed to help you build exceptional software with performance, security, and user experience as top priorities. Use the workflows, follow the rules, and create something memorable! 🚀
