import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const configPath = path.join(root, "src-tauri", "tauri.conf.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const version = config.version;
const owner = process.env.GITHUB_REPOSITORY_OWNER ?? "Jmiller10212";
const repo = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "BlendKeys";
const tag = process.env.GITHUB_REF_NAME ?? `v${version}`;
const nsisDir = path.join(root, "src-tauri", "target", "release", "bundle", "nsis");
const setupName = `BlendKeys_${version}_x64-setup.exe`;
const setupPath = path.join(nsisDir, setupName);
const signaturePath = `${setupPath}.sig`;

if (!fs.existsSync(setupPath)) {
  throw new Error(`Missing updater setup file: ${setupPath}`);
}

if (!fs.existsSync(signaturePath)) {
  throw new Error(`Missing updater signature file: ${signaturePath}`);
}

const releaseDir = path.join(root, "release", "updater");
fs.mkdirSync(releaseDir, { recursive: true });

fs.copyFileSync(setupPath, path.join(releaseDir, setupName));
fs.copyFileSync(signaturePath, path.join(releaseDir, `${setupName}.sig`));

const manifest = {
  version,
  notes: `BlendKeys ${version}`,
  pub_date: new Date().toISOString(),
  platforms: {
    "windows-x86_64": {
      signature: fs.readFileSync(signaturePath, "utf8").trim(),
      url: `https://github.com/${owner}/${repo}/releases/download/${tag}/${setupName}`,
    },
  },
};

fs.writeFileSync(path.join(releaseDir, "latest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Wrote ${path.join(releaseDir, "latest.json")}`);
