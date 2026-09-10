// Server-only access to this app's Cloudflare bindings.
//
// PRODUCTION: reads the Worker `env` DIRECTLY from the runtime module
// "cloudflare:workers" on every call — the same mechanism the framework and
// Cloudflare document, independent of how the bundle is split between the
// Worker entry and route handlers.
//
// TESTS: `captureEnv` installs an override so the integration suite can run
// the real server modules against an in-memory adapter without Cloudflare.
// Overrides are never used for real accounts in production.
import { env } from "cloudflare:workers";
import type {
  D1Database,
  DurableObjectNamespace,
  R2Bucket,
} from "@cloudflare/workers-types";

export type AppEnv = {
  DB?: D1Database;
  STORAGE?: R2Bucket;
  ROOMS?: DurableObjectNamespace;
  HF_ENV?: string;
  APP_SLUG?: string;
  // Optional owner-configured secrets (read per request, never shipped to the
  // browser). See docs/ENV_TEMPLATE.md for the full list.
  RESEND_API_KEY?: string;
  MAILGUN_API_KEY?: string;
  MAILGUN_DOMAIN?: string;
  SENDGRID_API_KEY?: string;
  MAIL_FROM?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_PRICE_PRO_MONTHLY?: string;
  STRIPE_PRICE_PRO_YEARLY?: string;
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
};

let testOverride: AppEnv | null = null;

// Test-only injection point (never called by application code).
export function captureEnv(captured: unknown): void {
  if (captured && typeof captured === "object") {
    testOverride = captured as AppEnv;
  } else {
    testOverride = null;
  }
}

export function bindings(): AppEnv {
  // NOTE: `env` cannot be captured at module scope in a way that survives
  // bundler code splitting reliably; read it per call. `env` is the same
  // object handed to the Worker fetch handler and Durable Object
  // constructors — this is the canonical access path.
  return testOverride ?? (env as unknown as AppEnv);
}