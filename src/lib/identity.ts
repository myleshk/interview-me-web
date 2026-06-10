/** Identity loaded from environment variables at build time.
 *
 * Add these to ``.env.local`` or your deployment environment::
 *
 *   NEXT_PUBLIC_IDENTITY_NAME=Myles Fang
 *   NEXT_PUBLIC_IDENTITY_TITLE=Senior Engineer
 *   NEXT_PUBLIC_IDENTITY_EMPLOYER=Acme Corp
 *   NEXT_PUBLIC_IDENTITY_LOCATION=Tokyo, Japan
 *   NEXT_PUBLIC_API_URL=http://localhost:8000
 *   NEXT_PUBLIC_CV_URL=https://drive.google.com/...
 */

// Treat empty string the same as undefined so Docker builds without
// --build-arg still get the sensible fallback values.
function env(key: string, fallback: string): string {
  const value = process.env[key];
  return value ? value : fallback;
}

export const identity = {
  name: env("NEXT_PUBLIC_IDENTITY_NAME", "Candidate"),
  title: env("NEXT_PUBLIC_IDENTITY_TITLE", ""),
  employer: env("NEXT_PUBLIC_IDENTITY_EMPLOYER", ""),
  location: env("NEXT_PUBLIC_IDENTITY_LOCATION", ""),
};

export const apiUrl = env("NEXT_PUBLIC_API_URL", "http://localhost:8000");

export const cvUrl = env("NEXT_PUBLIC_CV_URL", "");
