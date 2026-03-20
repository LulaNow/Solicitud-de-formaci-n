import { prisma } from "./prisma";

export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  error?: string;
}> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { connected: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown database error";
    return { connected: false, error: message };
  }
}

export async function ensureDatabaseReady(): Promise<void> {
  const { connected, error } = await checkDatabaseConnection();

  if (!connected) {
    throw new Error(
      `Database connection failed: ${error}. Please check your DATABASE_URL in .env`
    );
  }
}
