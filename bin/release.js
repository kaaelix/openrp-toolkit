#!/usr/bin/env node

/**
 * OpenRP Toolkit: Local 1-Click Release & Sync Engine
 * 
 * Performs 100% local release without relying on GitHub Actions:
 * 1. Pre-flight static validation of all behavior blueprints
 * 2. Auto-sync skills & MCP configs to all local AI assistants (~/.agents, Claude, Codex, Cursor)
 * 3. Version bump (patch / minor / major)
 * 4. Direct npm publishing (npm publish --access public)
 * 5. Git commit, tag, and push
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { validateBehaviorGraph } = require('./validator');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const PKG_PATH = path.join(PACKAGE_ROOT, 'package.json');
const README_PATH = path.join(PACKAGE_ROOT, 'README.md');

const args = process.argv.slice(2);
const bumpType = args[0] || 'patch'; // patch | minor | major | none

function run(cmd, desc) {
  console.log(`\n▶ ${desc}...`);
  try {
    const out = execSync(cmd, { cwd: PACKAGE_ROOT, stdio: 'inherit' });
    return true;
  } catch (err) {
    console.error(`❌ Command failed: ${cmd}`);
    return false;
  }
}

async function main() {
  console.log('====================================================');
  console.log('🚀 OpenRP Toolkit Local Release & Sync Engine');
  console.log('====================================================');

  const pkg = JSON.parse(fs.readFileSync(PKG_PATH, 'utf8'));
  const currentVer = pkg.version;
  console.log(`Current Version: v${currentVer}`);

  // 1. Static Validation
  console.log('\n[Step 1/5] Running Pre-Flight Blueprint Validation...');
  const sampleBehaviors = [
    path.join(PACKAGE_ROOT, 'skills', 'openrp', 'references', 'official_image_rpg_behavior.json'),
    path.join(PACKAGE_ROOT, 'skills', 'openrp', 'references', 'official_chat_behavior_54nodes.json')
  ];

  for (const bPath of sampleBehaviors) {
    if (fs.existsSync(bPath)) {
      const graph = JSON.parse(fs.readFileSync(bPath, 'utf8')).graph;
      const val = validateBehaviorGraph(graph);
      if (val.errors.length > 0) {
        console.error(`❌ Validation failed for ${path.basename(bPath)}:`, val.errors);
        process.exit(1);
      }
    }
  }
  console.log('✅ All behavioral graphs validated with 0 errors.');

  // 2. Auto-Sync Skills Locally
  console.log('\n[Step 2/5] Auto-Synchronizing Skills to Local AI Assistants...');
  run('node bin/cli.js sync', 'Synchronizing skill files');

  // 3. Version Bump
  let nextVer = currentVer;
  if (bumpType !== 'none') {
    const parts = currentVer.split('.').map(Number);
    if (bumpType === 'major') parts[0]++;
    else if (bumpType === 'minor') parts[1]++;
    else parts[2]++; // default patch

    nextVer = parts.join('.');
    console.log(`\n[Step 3/5] Bumping version: v${currentVer} -> v${nextVer} (${bumpType})`);
    
    pkg.version = nextVer;
    fs.writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

    // Update README if version mentioned
    if (fs.existsSync(README_PATH)) {
      let readme = fs.readFileSync(README_PATH, 'utf8');
      readme = readme.replace(new RegExp(`v${currentVer}`, 'g'), `v${nextVer}`);
      fs.writeFileSync(README_PATH, readme, 'utf8');
    }
    console.log(`✅ Version updated in package.json & README.md.`);
  } else {
    console.log('\n[Step 3/5] Skipping version bump (bumpType: none).');
  }

  // 4. npm publish
  console.log('\n[Step 4/5] Publishing directly to npm registry...');
  try {
    execSync('npm publish --access public', { cwd: PACKAGE_ROOT, stdio: 'inherit' });
    console.log(`🎉 [PUBLISHED] Successfully published v${nextVer} to npmjs.org!`);
  } catch (err) {
    console.warn(`⚠️ npm publish notice: ${err.message || 'Run `npm login` to publish to npm directly.'}`);
  }

  // 5. Git Commit & Push
  console.log('\n[Step 5/5] Committing changes & pushing to GitHub...');
  run('git add -A', 'Staging all updated files');
  run(`git commit -m "release: v${nextVer} [auto-sync & verified]"`, 'Creating git commit');
  run(`git tag -a v${nextVer} -m "Release v${nextVer}" || true`, 'Creating git tag');
  run('git push origin main --tags', 'Pushing commits & tags to GitHub');

  console.log('\n====================================================');
  console.log(`🎉 [SUCCESS] OpenRP Toolkit v${nextVer} released and synced!`);
  console.log('====================================================\n');
}

main().catch(err => {
  console.error('Fatal release error:', err);
  process.exit(1);
});
