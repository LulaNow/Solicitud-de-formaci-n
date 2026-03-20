# Security-First Development

## Core Security Principles

### Defense in Depth
- Multiple layers of security
- Never trust user input
- Validate on both client and server
- Assume breach mentality

### Least Privilege
- Grant minimum necessary permissions
- Separate concerns
- Use role-based access control
- Audit access regularly

## Authentication & Authorization

### Password Security

```typescript
// ✅ GOOD: Proper password hashing
import bcrypt from 'bcrypt';

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// ❌ BAD: Storing plain text passwords
function savePassword(password: string) {
  db.users.update({ password }); // NEVER DO THIS
}
```

### JWT Best Practices

```typescript
// ✅ GOOD: Secure JWT configuration
const token = jwt.sign(
  { userId: user.id, role: user.role },
  process.env.JWT_SECRET!,
  {
    expiresIn: '15m',
    algorithm: 'HS256',
    issuer: 'your-app',
    audience: 'your-app-users'
  }
);

// Store refresh token securely
const refreshToken = generateRefreshToken();
await storeRefreshToken(userId, refreshToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});
```

### Session Management

```typescript
// ✅ GOOD: Secure session configuration
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 // 1 hour
  }
}));
```

## Input Validation & Sanitization

### Always Validate Input

```typescript
import { z } from 'zod';

// ✅ GOOD: Validate all inputs
const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100)
});

async function createUser(input: unknown) {
  const validated = userSchema.parse(input);
  // Now safe to use validated data
  return await db.users.create(validated);
}

// ❌ BAD: No validation
async function createUser(input: any) {
  return await db.users.create(input);
}
```

### SQL Injection Prevention

```typescript
// ✅ GOOD: Use parameterized queries
const user = await db.query(
  'SELECT * FROM users WHERE email = $1',
  [email]
);

// ✅ GOOD: Use ORM with proper escaping
const user = await prisma.user.findUnique({
  where: { email }
});

// ❌ BAD: String concatenation
const user = await db.query(
  `SELECT * FROM users WHERE email = '${email}'`
);
```

### XSS Prevention

```typescript
// ✅ GOOD: Sanitize user content
import DOMPurify from 'isomorphic-dompurify';

function renderUserContent(html: string) {
  const clean = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'b', 'i', 'em', 'strong', 'a'],
    ALLOWED_ATTR: ['href']
  });
  return <div dangerouslySetInnerHTML={{ __html: clean }} />;
}

// ❌ BAD: Directly rendering user HTML
function renderUserContent(html: string) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
```

## API Security

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// ✅ GOOD: Implement rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

app.use('/api/', limiter);
```

### CORS Configuration

```typescript
// ✅ GOOD: Strict CORS policy
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ❌ BAD: Allow all origins
app.use(cors({ origin: '*' }));
```

### API Authentication

```typescript
// ✅ GOOD: Verify JWT on protected routes
async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

## Environment Variables

### Secure Configuration

```typescript
// ✅ GOOD: Validate environment variables
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  API_KEY: z.string().min(20),
  NODE_ENV: z.enum(['development', 'production', 'test'])
});

const env = envSchema.parse(process.env);

// ❌ BAD: No validation
const DATABASE_URL = process.env.DATABASE_URL;
```

### Never Commit Secrets

```bash
# .gitignore
.env
.env.local
.env.*.local
secrets/
*.key
*.pem
```

## Data Protection

### Encryption at Rest

```typescript
import crypto from 'crypto';

// ✅ GOOD: Encrypt sensitive data
function encrypt(text: string): string {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}
```

### Secure File Uploads

```typescript
// ✅ GOOD: Validate file uploads
const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxFileSize = 5 * 1024 * 1024; // 5MB

function validateUpload(file: File): boolean {
  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error('Invalid file type');
  }
  
  if (file.size > maxFileSize) {
    throw new Error('File too large');
  }
  
  return true;
}
```

## Security Headers

```typescript
// ✅ GOOD: Set security headers
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Logging & Monitoring

### Secure Logging

```typescript
// ✅ GOOD: Log without sensitive data
function logUserAction(user: User, action: string) {
  logger.info({
    userId: user.id,
    action,
    timestamp: new Date().toISOString()
  });
}

// ❌ BAD: Logging sensitive data
function logUserAction(user: User, action: string) {
  logger.info({
    user, // Contains password, email, etc.
    action
  });
}
```

### Error Handling

```typescript
// ✅ GOOD: Generic error messages to client
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log full error server-side
  logger.error(err);
  
  // Send generic message to client
  res.status(500).json({
    error: 'Internal server error'
  });
});

// ❌ BAD: Exposing error details
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    error: err.message,
    stack: err.stack
  });
});
```

## Security Checklist

Before deploying:

- [ ] All user inputs validated and sanitized
- [ ] SQL injection prevention implemented
- [ ] XSS protection in place
- [ ] CSRF tokens for state-changing operations
- [ ] Authentication and authorization working
- [ ] Passwords properly hashed (bcrypt, argon2)
- [ ] Secrets in environment variables, not code
- [ ] HTTPS enforced in production
- [ ] Security headers configured (helmet)
- [ ] Rate limiting implemented
- [ ] CORS properly configured
- [ ] File uploads validated
- [ ] Error messages don't leak information
- [ ] Logging doesn't include sensitive data
- [ ] Dependencies scanned for vulnerabilities
- [ ] API endpoints require authentication
- [ ] Session management secure

## OWASP Top 10 Protection

1. **Broken Access Control**: Implement proper authorization
2. **Cryptographic Failures**: Use strong encryption
3. **Injection**: Parameterized queries, input validation
4. **Insecure Design**: Security by design
5. **Security Misconfiguration**: Secure defaults
6. **Vulnerable Components**: Keep dependencies updated
7. **Authentication Failures**: Strong auth mechanisms
8. **Data Integrity Failures**: Verify data integrity
9. **Logging Failures**: Proper logging and monitoring
10. **SSRF**: Validate and sanitize URLs

## Regular Security Tasks

### Weekly
- Review access logs
- Check for failed login attempts
- Monitor rate limiting triggers

### Monthly
- Update dependencies
- Run security audit: `npm audit`
- Review user permissions

### Quarterly
- Penetration testing
- Security training
- Review and update security policies
