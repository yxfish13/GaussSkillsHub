import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  ADMIN_USERNAME: z.string().min(1).optional(),
  ADMIN_PASSWORD: z.string().min(1).optional(),
  AUTH_SECRET: z.string().min(32).optional()
});

export type AppEnv = z.infer<typeof envSchema>;

export function getEnv(source: Record<string, string | undefined> = process.env): AppEnv {
  return envSchema.parse(source);
}

export function getAuthSecretValue(source: Record<string, string | undefined> = process.env) {
  return (
    getEnv(source).AUTH_SECRET ??
    "development-auth-secret-change-me-before-production"
  );
}
