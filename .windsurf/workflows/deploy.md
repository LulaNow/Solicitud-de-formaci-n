---
description: Deploy application to production or staging environment
---

# /deploy - Deploy Application

## Purpose

Deploy the application to production or staging environment with proper checks and validation.

## Steps

1. **Pre-deployment Checks**
   - Run all tests
   - Check for TypeScript/linting errors
   - Verify environment variables
   - Review security vulnerabilities

// turbo
2. **Build Verification**
   - Run production build
   - Check bundle size
   - Verify no build errors

3. **Deployment Strategy Selection**
   - Determine target platform (Vercel, Netlify, AWS, etc.)
   - Configure deployment settings
   - Set up environment variables

// turbo
4. **Deploy**
   - Execute deployment
   - Monitor deployment logs
   - Verify deployment success

5. **Post-deployment Verification**
   - Check application is accessible
   - Verify critical features work
   - Monitor error logs

## Platform-Specific Commands

### Vercel
```bash
vercel --prod
```

### Netlify
```bash
netlify deploy --prod
```

### Docker
```bash
docker build -t app .
docker push app
```

## Pre-deployment Checklist

- [ ] All tests passing
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Security scan passed
- [ ] Performance benchmarks met

## Key Principles

- **Test before deploy** - never deploy untested code
- **Monitor actively** - watch logs during deployment
- **Rollback ready** - have rollback plan
- **Verify post-deploy** - check critical paths work
