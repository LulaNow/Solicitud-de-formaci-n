---
description: Multi-agent coordination for complex tasks requiring multiple perspectives
---

# /orchestrate - Multi-Agent Coordination

## Purpose

Coordinate complex tasks that benefit from multiple perspectives and parallel analysis across different domains.

## When to Use

Use orchestration when a task requires:
- Multiple domain expertise (security, backend, frontend, testing)
- Parallel analysis from different perspectives
- Coordinated execution across different layers
- Comprehensive review from multiple angles

## Steps

1. **Quick Context Check**
   - Review existing plan files if any
   - If request is clear, proceed directly
   - If major ambiguity, ask 1-2 quick questions

2. **Task Analysis**
   - Identify which domains the task touches
   - Determine required expertise areas
   - Plan coordination strategy

3. **Domain Selection**
   - Security (authentication, vulnerabilities)
   - Backend (API, business logic, databases)
   - Frontend (UI, components, state management)
   - Testing (unit, integration, e2e)
   - DevOps (deployment, CI/CD, monitoring)
   - Performance (optimization, profiling)

4. **Sequential Execution**
   - Execute domain-specific tasks in logical order
   - Share context between domains
   - Synthesize findings

5. **Synthesis & Report**
   - Combine findings into cohesive output
   - Provide actionable recommendations
   - Identify next steps

## Orchestration Workflow

### Step 1: Analyze Task Domains

```
What domains does this task touch?
- [ ] Security
- [ ] Backend
- [ ] Frontend
- [ ] Database
- [ ] Testing
- [ ] DevOps
- [ ] Mobile
- [ ] Performance
```

### Step 2: Plan Execution Order

```
Logical execution order:
1. Discovery/Exploration → Map affected areas
2. Domain Analysis → Analyze/implement per domain
3. Testing → Verify changes
4. Security → Final security check (if applicable)
5. Performance → Optimization check (if applicable)
```

### Step 3: Execute & Synthesize

Execute each domain task and combine results.

## Output Format

```markdown
## 🎯 Orchestration Report

### Task: [Original Task]

### Domains Analyzed
1. **[Domain 1]**: [brief finding]
2. **[Domain 2]**: [brief finding]
3. **[Domain 3]**: [brief finding]

### Key Findings

#### Security
- [Finding 1]
- [Finding 2]

#### Backend
- [Finding 1]
- [Finding 2]

#### Frontend
- [Finding 1]
- [Finding 2]

#### Testing
- [Finding 1]
- [Finding 2]

### Recommendations

1. **Priority 1**: [Critical recommendation]
2. **Priority 2**: [Important recommendation]
3. **Priority 3**: [Nice to have]

### Next Steps
- [ ] Action item 1
- [ ] Action item 2
- [ ] Action item 3
```

## Domain Boundaries

### Strict Boundaries

Each domain must stay within its expertise:

| Domain | Responsibilities | Cannot Do |
|--------|-----------------|-----------|
| **Frontend** | Components, UI, styles, hooks | Test files, API routes, DB |
| **Backend** | API, server logic, DB queries | UI components, styles |
| **Testing** | Test files, mocks, coverage | Production code |
| **Security** | Audit, vulnerabilities, auth review | Feature code, UI |
| **DevOps** | CI/CD, deployment, infra config | Application code |
| **Performance** | Profiling, optimization, caching | New features |

## Examples

```
/orchestrate review and improve authentication system
/orchestrate build e-commerce checkout flow
/orchestrate optimize dashboard performance
/orchestrate security audit for API
```

## Conflict Resolution

### Same File Edits
If multiple domains suggest changes to the same file:
1. Collect all suggestions
2. Present merged recommendation
3. Ask user for preference if conflicts exist

### Disagreement Between Domains
If domains provide conflicting recommendations:
1. Note both perspectives
2. Explain trade-offs
3. Recommend based on context (security > performance > convenience)

## Best Practices

1. **Start small** - Begin with 2-3 domains, add more if needed
2. **Context sharing** - Pass relevant findings to subsequent domains
3. **Verify before commit** - Always include testing for code changes
4. **Security last** - Security audit as final check
5. **Synthesize clearly** - Unified report, not separate outputs

## Key Principles

- **Clarify before orchestrating** - Don't assume, ask if unclear
- **Respect domain boundaries** - Each domain stays in its lane
- **Sequential execution** - Logical order matters
- **Comprehensive synthesis** - Combine findings coherently
- **Actionable output** - Clear next steps
