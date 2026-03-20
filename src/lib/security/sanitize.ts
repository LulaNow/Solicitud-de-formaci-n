export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T
): T {
  const sanitized = {} as Record<string, unknown>;

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value);
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string"
          ? sanitizeInput(item)
          : typeof item === "object" && item !== null
            ? sanitizeObject(item as Record<string, unknown>)
            : item
      );
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

export function stripSensitiveFields<T extends Record<string, unknown>>(
  obj: T,
  fields: string[] = ["passwordHash", "password_hash", "password", "secret", "token"]
): Partial<T> {
  const cleaned = { ...obj };
  for (const field of fields) {
    if (field in cleaned) {
      delete cleaned[field as keyof T];
    }
  }
  return cleaned;
}

export function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    if (process.env.NODE_ENV === "production") {
      return "An internal error occurred";
    }
    return error.message;
  }
  return "An unknown error occurred";
}
