/** Runtime configuration loaded from /config.json
 *
 * Local dev: public/config.json (checked into repo with defaults).
 * K8s: ConfigMap mounts over the file — single source of truth,
 * no build-time baking required.
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
