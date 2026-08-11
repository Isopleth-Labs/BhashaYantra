import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const failures = [];
const textExtensions = new Set([".js", ".jsx", ".mjs", ".ts", ".tsx", ".json", ".toml", ".yml", ".yaml"]);

function walk(relativeDirectory) {
  const absoluteDirectory = resolve(root, relativeDirectory);
  return readdirSync(absoluteDirectory, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory() && ["target", "gen", "node_modules", "dist"].includes(entry.name)) return [];
    const relativePath = join(relativeDirectory, entry.name);
    if (entry.isDirectory()) return walk(relativePath);
    return textExtensions.has(extname(entry.name).toLowerCase()) ? [relativePath] : [];
  });
}

const applicationFiles = [...walk("src"), ...walk("src-tauri")];
for (const relativePath of applicationFiles) {
  const source = readFileSync(resolve(root, relativePath), "utf8");
  if (/VITE_[A-Z0-9_]*(?:SERVICE_ROLE|SECRET|PRIVATE_KEY)/u.test(source)) failures.push(`${relativePath} references a secret-shaped VITE variable`);
  if (/DATABASE_URL/u.test(source)) failures.push(`${relativePath} references DATABASE_URL; database credentials must not enter the desktop bundle`);
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u.test(source)) failures.push(`${relativePath} contains a private key`);
  if (/(?:sk_live_|sb_secret_)[A-Za-z0-9_-]{12,}/u.test(source)) failures.push(`${relativePath} appears to contain a live secret`);
}

const tauriConfig = JSON.parse(readFileSync(resolve(root, "src-tauri/tauri.conf.json"), "utf8"));
if (!tauriConfig.app?.security?.csp) failures.push("Tauri CSP is missing");
if (tauriConfig.app?.security?.dangerousDisableAssetCspModification === true) failures.push("Tauri asset CSP modification is dangerously disabled");
if (tauriConfig.identifier !== "com.bhashayantra.desktop") failures.push("Permanent Tauri identifier changed");

for (const workflowPath of walk(".github/workflows")) {
  const workflow = readFileSync(resolve(root, workflowPath), "utf8");
  if (/pull_request_target\s*:/u.test(workflow)) failures.push(`${workflowPath} uses privileged pull_request_target`);
  for (const match of workflow.matchAll(/^\s*uses:\s*([^\s#]+)(?:\s*#.*)?$/gmu)) {
    const action = match[1];
    if (action.startsWith("./")) continue;
    if (!/@[0-9a-f]{40}$/u.test(action)) failures.push(`${workflowPath} action is not pinned to a full commit SHA: ${action}`);
  }
}

const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);
for (const file of tracked) {
  if (file === ".env" || file === ".env.local" || /^\.env\..*\.local$/u.test(file)) failures.push(`${file} must not be tracked`);
}

if (failures.length) {
  console.error("BhashaYantra security check failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Security contract verified across ${applicationFiles.length} application files and pinned workflows.`);
