import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";
import { resolve } from "node:path";

// Resolve .env relative to the application, independently of the shell directory.
export const applicationDirectory = fileURLToPath(new URL("../../", import.meta.url));
const envPath = resolve(applicationDirectory, ".env");
if (existsSync(envPath)) process.loadEnvFile(envPath);

export function readOciSettings(env = process.env) {
  const required = (key) => {
    const value = env[key]?.trim();
    if (!value || value.startsWith("TON_")) throw new Error(`Missing configuration: ${key}`);
    return value;
  };
  const namespaceName = required("OCI_NAMESPACE");
  const bucketName = required("OCI_DAILY_BUCKET");
  const prefix = required("OCI_DAILY_PREFIX");
  const profile = env.OCI_CONFIG_PROFILE?.trim() || "DEFAULT";
  const rawPath = env.OCI_CONFIG_FILE?.trim();
  const configFile = !rawPath ? undefined : rawPath.startsWith("~/")
    ? resolve(homedir(), rawPath.slice(2)) : resolve(applicationDirectory, rawPath);
  return Object.freeze({ namespaceName, bucketName, prefix, profile, configFile });
}
