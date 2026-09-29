#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const packageJsonPath = path.join(rootDir, 'package.json');
const tauriConfPath = path.join(rootDir, 'src-tauri', 'tauri.conf.json');
const cargoTomlPath = path.join(rootDir, 'src-tauri', 'Cargo.toml');

const args = process.argv.slice(2);
const target = args[0];
const shouldGitTag = args.includes('--tag') || args.includes('-t');

if (!target || target === '--help' || target === '-h') {
  console.log(`
Usage:
  node scripts/bump_version.js <new-version | patch | minor | major> [--tag]

Examples:
  node scripts/bump_version.js 1.0.0
  node scripts/bump_version.js patch
  node scripts/bump_version.js 1.0.1 --tag

Options:
  --tag, -t   Automatically stage modified version files, commit, and create git tag v<version>
`);
  process.exit(0);
}

// 1. Read current version from package.json
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const currentVersion = pkg.version || '0.0.1';

function parseSemVer(v) {
  const clean = v.replace(/^v/, '');
  const parts = clean.split('.').map(n => parseInt(n, 10));
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid semver version: ${v}`);
  }
  return parts;
}

let newVersion = '';
if (['patch', 'minor', 'major'].includes(target)) {
  const [major, minor, patch] = parseSemVer(currentVersion);
  if (target === 'patch') newVersion = `${major}.${minor}.${patch + 1}`;
  if (target === 'minor') newVersion = `${major}.${minor + 1}.0`;
  if (target === 'major') newVersion = `${major + 1}.0.0`;
} else {
  // Validate specified version format
  parseSemVer(target);
  newVersion = target.replace(/^v/, '');
}

console.log(`\n🚀 Bumping app version: ${currentVersion} -> ${newVersion}\n`);

// 2. Update package.json
pkg.version = newVersion;
fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
console.log(` ✓ Updated package.json`);

// 3. Update tauri.conf.json
if (fs.existsSync(tauriConfPath)) {
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
  tauriConf.version = newVersion;
  fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n', 'utf8');
  console.log(` ✓ Updated src-tauri/tauri.conf.json`);
}

// 4. Update Cargo.toml
if (fs.existsSync(cargoTomlPath)) {
  let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
  cargoToml = cargoToml.replace(
    /(\[package\][\s\S]*?version\s*=\s*")[^"]+(")/,
    `$1${newVersion}$2`
  );
  fs.writeFileSync(cargoTomlPath, cargoToml, 'utf8');
  console.log(` ✓ Updated src-tauri/Cargo.toml`);
}

console.log(`\n✨ All version files synchronized to v${newVersion}!`);

// 5. Git commit and tag if requested
if (shouldGitTag) {
  try {
    console.log(`\n📦 Creating git commit and tag v${newVersion}...`);
    execSync('git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml', { cwd: rootDir, stdio: 'inherit' });
    execSync(`git commit -m "chore: release v${newVersion}"`, { cwd: rootDir, stdio: 'inherit' });
    execSync(`git tag "v${newVersion}"`, { cwd: rootDir, stdio: 'inherit' });
    console.log(`\n🎉 Created git tag v${newVersion}!`);
    console.log(`Next step: push the branch and tags to trigger the release build:`);
    console.log(`   git push origin main --tags\n`);
  } catch (err) {
    console.error(`❌ Failed to create git commit/tag:`, err.message);
  }
} else {
  console.log(`\nTo commit and tag this version for release, run:`);
  console.log(`   git add package.json src-tauri/tauri.conf.json src-tauri/Cargo.toml`);
  console.log(`   git commit -m "chore: release v${newVersion}"`);
  console.log(`   git tag v${newVersion}`);
  console.log(`   git push origin main --tags\n`);
}
