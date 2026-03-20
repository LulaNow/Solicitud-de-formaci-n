---
description: Check project status, health, and progress
---

# /status - Project Status Check

## Purpose

Check project status, health metrics, and overall progress.

## Steps

// turbo
1. **Code Health Check**
   - Run linting
   - Check TypeScript errors
   - Review test coverage
   - Check for security vulnerabilities

2. **Dependency Analysis**
   - Check for outdated packages
   - Review security advisories
   - Identify unused dependencies

3. **Performance Metrics**
   - Check bundle size
   - Review build times
   - Analyze runtime performance

4. **Project Progress**
   - Review completed tasks
   - Check pending work
   - Identify blockers

## Status Report Format

```markdown
## 📊 Project Status Report

### ✅ Health Metrics
- **Tests**: [passing/total] ([coverage]%)
- **TypeScript**: [errors count]
- **Linting**: [warnings count]
- **Security**: [vulnerabilities count]

### 📦 Dependencies
- **Total packages**: [count]
- **Outdated**: [count]
- **Security issues**: [count]

### ⚡ Performance
- **Bundle size**: [size] KB
- **Build time**: [time]s
- **Test execution**: [time]s

### 🎯 Progress
- **Completed**: [count] tasks
- **In Progress**: [count] tasks
- **Pending**: [count] tasks
- **Blockers**: [list]

### 🚨 Issues
- [Critical issue 1]
- [Warning 1]

### 💡 Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
```

## Health Check Commands

```bash
# Linting
npm run lint

# TypeScript
npx tsc --noEmit

# Tests
npm test

# Security
npm audit

# Dependencies
npm outdated

# Bundle analysis
npm run build
```

## Key Principles

- **Automated checks** - use CI/CD for continuous monitoring
- **Regular reviews** - check status weekly
- **Act on warnings** - don't ignore small issues
- **Track trends** - monitor metrics over time
