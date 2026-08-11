import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const readJson = (file) => JSON.parse(readFileSync(resolve(root, file), "utf8"));
const packageJson = readJson("package.json");
const tauriConfig = readJson("src-tauri/tauri.conf.json");
const cargoToml = readFileSync(resolve(root, "src-tauri/Cargo.toml"), "utf8");
const cargoVersion = cargoToml.match(/^version\s*=\s*"([^"]+)"/m)?.[1];
const failures = [];

if (packageJson.version !== tauriConfig.version || packageJson.version !== cargoVersion) failures.push("package.json, tauri.conf.json, and Cargo.toml versions must match");
if (!/^[0-9]+\.[0-9]+\.[0-9]+-beta\.[0-9]+$/u.test(packageJson.version)) failures.push("beta version must use x.y.z-beta.n SemVer");
if (tauriConfig.identifier !== "com.bhashayantra.desktop") failures.push("permanent application identifier changed; this would risk user-data continuity");
if (!tauriConfig.app?.security?.csp) failures.push("production Content Security Policy is missing");
if (process.env.GITHUB_REF_TYPE === "tag" && process.env.GITHUB_REF_NAME !== `v${packageJson.version}`) failures.push(`tag must be v${packageJson.version}`);

if (process.argv.includes("--publish")) {
  if (process.env.BETA_RELEASES_ENABLED !== "true") failures.push("BETA_RELEASES_ENABLED repository variable is not true");
  if (!packageJson.dependencies?.["@tauri-apps/plugin-updater"] || !packageJson.dependencies?.["@tauri-apps/plugin-process"]) failures.push("signed Tauri updater and process plugins are not configured");
  const updater = tauriConfig.plugins?.updater;
  if (!updater?.pubkey || !Array.isArray(updater.endpoints) || updater.endpoints.length === 0) failures.push("signed updater public key and endpoint are not configured");
  if (!process.env.TAURI_SIGNING_PRIVATE_KEY) failures.push("TAURI_SIGNING_PRIVATE_KEY secret is missing");
  if (process.env.WINDOWS_CODESIGN_CONFIGURED !== "true") failures.push("Windows code signing is not confirmed");
}

if (failures.length > 0) {
  console.error("BhashaYantra beta release gate failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`BhashaYantra ${packageJson.version} beta contract verified (${tauriConfig.identifier}).`);
