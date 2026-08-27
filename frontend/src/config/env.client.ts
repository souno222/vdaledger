import { z } from "zod";

const apiBaseUrlSchema = z.string().url().refine(
  (value) => {
    const url = new URL(value);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      !url.search &&
      !url.hash &&
      url.pathname === "/"
    );
  },
  {
    message:
      "Must be an HTTP(S) origin without credentials, a path, query, or fragment.",
  },
);

const localRouteSchema = z
  .string()
  .startsWith("/")
  .refine((value) => !value.startsWith("//") && !value.includes("\\"), {
    message: "Must be a same-origin application path.",
  });

const clientEnvironmentSchema = z.object({
  NEXT_PUBLIC_API_BASE_URL: apiBaseUrlSchema,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: localRouteSchema,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: localRouteSchema,
  NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: localRouteSchema,
  NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: localRouteSchema,
});

const parsedEnvironment = clientEnvironmentSchema.safeParse({
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
  NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL:
    process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL,
  NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL:
    process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL,
});

if (!parsedEnvironment.success) {
  throw new Error(
    `Invalid public environment configuration: ${z.prettifyError(parsedEnvironment.error)}`,
  );
}

export const clientEnvironment = parsedEnvironment.data;

