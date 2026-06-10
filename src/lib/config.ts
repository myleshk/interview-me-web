/** Configuration types for the chat app.
 *
 * Values are read from environment variables in a Server Component
 * and passed as props to avoid SSR hydration mismatches.
 */

export interface AppConfig {
  identity: {
    name: string;
    title: string;
    employer: string;
    location: string;
  };
  cvUrl: string;
}
