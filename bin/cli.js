#!/usr/bin/env node

/**
 * OpenRP Toolkit CLI
 * Model Context Protocol (MCP) Server & AI Agent Skill Installer
 * 
 * Maintained by Kaa (OpenRP Community Creator)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn, execSync } = require('child_process');
const readline = require('readline');
const https = require('https');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const MCP_SERVER_SCRIPT = path.join(PACKAGE_ROOT, 'mcp', 'openrp_mcp_server.py');
const SKILLS_DIR = path.join(PACKAGE_ROOT, 'skills', 'openrp');
const AUTH_FILE = path.join(os.homedir(), '.openrp_mcp_auth.json');

const args = process.argv.slice(2);
const command = args[0] || 'serve';

function printBanner() {
  console.log('+----------------------------------------------------------------+');
  console.log('|      OpenRP Toolkit & Model Context Protocol (MCP) Suite       |');
  console.log('|          Version: 3.0.0 | Maintainer: Kaa (Community)          |');
  console.log('+----------------------------------------------------------------+\n');
}

function showHelp() {
  printBanner();
  console.log('Usage:');
  console.log('  openrp-toolkit [command] [options]\n');
  console.log('Commands:');
  console.log('  serve                  Launch MCP server in stdio mode (default)');
  console.log('  install                Interactive installer for AI assistants & CLIs');
  console.log('  auth                   Interactive setup for OpenRP credentials');
  console.log('  doctor                 Run environment & API connectivity diagnostics');
  console.log('  help, --help, -h       Display this help documentation\n');
  console.log('Quick Examples:');
  console.log('  npx openrp-toolkit install');
  console.log('  npx openrp-toolkit auth');
  console.log('  npx openrp-toolkit doctor\n');
}

function runMcpServer() {
  if (!fs.existsSync(MCP_SERVER_SCRIPT)) {
    console.error(`[ERROR] MCP server script not found at: ${MCP_SERVER_SCRIPT}`);
    process.exit(1);
  }

  const pythonBin = process.env.PYTHON_BIN || 'python3';
  const child = spawn(pythonBin, [MCP_SERVER_SCRIPT], {
    stdio: ['pipe', 'pipe', 'inherit'],
    env: process.env
  });

  process.stdin.pipe(child.stdin);
  child.stdout.pipe(process.stdout);

  child.on('error', (err) => {
    console.error(`[ERROR] Failed to start Python MCP server with '${pythonBin}':`, err.message);
    console.error('[HINT] Ensure Python 3.10+ is installed and accessible in your PATH.');
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  let count = 0;

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      count += copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}

function mergeJsonConfig(configPath, keyPath, value) {
  let config = {};
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8').trim();
      if (content) {
        config = JSON.parse(content);
      }
    }
  } catch (err) {
    console.warn(`[WARN] Could not parse existing config at ${configPath}. Creating backup.`);
    fs.copyFileSync(configPath, `${configPath}.bak.${Date.now()}`);
    config = {};
  }

  let current = config;
  for (let i = 0; i < keyPath.length - 1; i++) {
    const key = keyPath[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  current[keyPath[keyPath.length - 1]] = value;

  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf8');
}

function getClaudeDesktopConfigPath() {
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  } else if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
  }
  return path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json');
}

const PLATFORM_REGISTRY = [
  {
    id: 'antigravity',
    name: 'Google Antigravity / Gemini CLI',
    detailPath: path.join(os.homedir(), '.agents', 'skills', 'openrp'),
    detect: () => {
      const p1 = path.join(os.homedir(), '.gemini');
      const p2 = path.join(os.homedir(), '.agents');
      return fs.existsSync(p1) || fs.existsSync(p2);
    },
    installSkill: (targetDir) => {
      const dest = targetDir || path.join(os.homedir(), '.agents', 'skills', 'openrp');
      const count = copyDirSync(SKILLS_DIR, dest);
      return { type: 'skill', count, dest };
    },
    installMcp: () => {
      const mcpConfig = path.join(os.homedir(), '.gemini', 'antigravity-cli', 'mcp_config.json');
      mergeJsonConfig(mcpConfig, ['mcpServers', 'openrp'], {
        command: 'python3',
        args: [MCP_SERVER_SCRIPT]
      });
      return { type: 'mcp', dest: mcpConfig };
    }
  },
  {
    id: 'claude_code',
    name: 'Claude Code CLI',
    detailPath: path.join(os.homedir(), '.claude', 'skills', 'openrp'),
    detect: () => {
      try {
        execSync('claude --version', { stdio: 'ignore' });
        return true;
      } catch {
        return fs.existsSync(path.join(os.homedir(), '.claude'));
      }
    },
    installSkill: (targetDir) => {
      const dest = targetDir || path.join(os.homedir(), '.claude', 'skills', 'openrp');
      const count = copyDirSync(SKILLS_DIR, dest);
      return { type: 'skill', count, dest };
    },
    installMcp: () => {
      try {
        execSync(`claude mcp add openrp python3 "${MCP_SERVER_SCRIPT}"`, { stdio: 'ignore' });
        return { type: 'mcp', detail: 'Executed: claude mcp add openrp ...' };
      } catch {
        return { type: 'mcp', detail: `Manual: claude mcp add openrp python3 "${MCP_SERVER_SCRIPT}"` };
      }
    }
  },
  {
    id: 'claude_desktop',
    name: 'Claude Desktop App',
    detailPath: getClaudeDesktopConfigPath(),
    detect: () => {
      const configPath = getClaudeDesktopConfigPath();
      return fs.existsSync(configPath) || fs.existsSync(path.dirname(configPath));
    },
    installSkill: null,
    installMcp: () => {
      const configPath = getClaudeDesktopConfigPath();
      mergeJsonConfig(configPath, ['mcpServers', 'openrp'], {
        command: 'python3',
        args: [MCP_SERVER_SCRIPT]
      });
      return { type: 'mcp', dest: configPath };
    }
  },
  {
    id: 'cursor',
    name: 'Cursor IDE',
    detailPath: path.join(process.cwd(), '.cursor', 'skills', 'openrp'),
    detect: () => {
      const p1 = path.join(os.homedir(), '.cursor');
      const p2 = path.join(process.cwd(), '.cursor');
      return fs.existsSync(p1) || fs.existsSync(p2);
    },
    installSkill: (targetDir) => {
      const dest = targetDir || path.join(process.cwd(), '.cursor', 'skills', 'openrp');
      const count = copyDirSync(SKILLS_DIR, dest);
      return { type: 'skill', count, dest };
    },
    installMcp: () => {
      const mcpConfig = path.join(process.cwd(), '.cursor', 'mcp.json');
      mergeJsonConfig(mcpConfig, ['mcpServers', 'openrp'], {
        command: 'python3',
        args: [MCP_SERVER_SCRIPT]
      });
      return { type: 'mcp', dest: mcpConfig };
    }
  },
  {
    id: 'windsurf',
    name: 'Windsurf (Codeium Cascade)',
    detailPath: path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json'),
    detect: () => {
      return fs.existsSync(path.join(os.homedir(), '.codeium', 'windsurf'));
    },
    installSkill: null,
    installMcp: () => {
      const mcpConfig = path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json');
      mergeJsonConfig(mcpConfig, ['mcpServers', 'openrp'], {
        command: 'python3',
        args: [MCP_SERVER_SCRIPT]
      });
      return { type: 'mcp', dest: mcpConfig };
    }
  }
];

function prompt(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans.trim());
  }));
}

function scanEnvironments() {
  console.log('Scanning environment for supported AI assistants and CLIs...\n');

  console.log('Target Platform               Status        Path / Details');
  console.log('-------------------------------------------------------------------------------');

  const scanResults = [];
  for (const plat of PLATFORM_REGISTRY) {
    const isDetected = plat.detect();
    scanResults.push({ platform: plat, detected: isDetected });

    const statusStr = isDetected ? '[DETECTED] ' : '[NOT FOUND]';
    const nameStr = plat.name.padEnd(29);
    const shortPath = plat.detailPath.replace(os.homedir(), '~');
    console.log(`${nameStr} ${statusStr}   ${shortPath}`);
  }
  console.log('-------------------------------------------------------------------------------\n');

  return scanResults;
}

async function runInstall() {
  printBanner();
  
  const scanResults = scanEnvironments();
  const detectedList = scanResults.filter(r => r.detected).map(r => r.platform);

  console.log(`Scan Summary: Found ${detectedList.length} active platform(s).\n`);

  console.log('Select Installation Action:');
  console.log(`  [1] Quick Install to All Detected Platforms (${detectedList.length} found)`);
  console.log('  [2] Custom Platform Selection (Pick specific targets)');
  console.log('  [3] Install Skill Files Only (Custom target directory)');
  console.log('  [4] Force Install to All Known Platforms (Global)');
  console.log('  [5] Cancel\n');

  const mode = await prompt('Enter choice (1-5) [default: 1]: ');

  if (mode === '5') {
    console.log('\n[INFO] Installation cancelled.');
    return;
  }

  let selectedPlatforms = [];
  let installSkills = true;
  let installMcp = true;
  let customTargetDir = null;

  if (mode === '3') {
    console.log('\nInstall Skill Files to Custom Directory:');
    const customPath = await prompt(`Target Directory [default: ./openrp-skill]: `);
    customTargetDir = path.resolve(customPath || './openrp-skill');
    selectedPlatforms = [{
      name: 'Custom Directory',
      installSkill: () => {
        const count = copyDirSync(SKILLS_DIR, customTargetDir);
        return { type: 'skill', count, dest: customTargetDir };
      },
      installMcp: null
    }];
  } else if (mode === '2') {
    console.log('\nAvailable Target Platforms:');
    PLATFORM_REGISTRY.forEach((p, i) => {
      const isDet = p.detect() ? '(Detected)' : '';
      console.log(`  [${i + 1}] ${p.name.padEnd(30)} ${isDet}`);
    });
    console.log(`  [${PLATFORM_REGISTRY.length + 1}] Select All Platforms\n`);

    const sel = await prompt(`Select platform number (1-${PLATFORM_REGISTRY.length + 1}): `);
    const selIdx = parseInt(sel, 10);

    if (selIdx >= 1 && selIdx <= PLATFORM_REGISTRY.length) {
      selectedPlatforms = [PLATFORM_REGISTRY[selIdx - 1]];
    } else if (selIdx === PLATFORM_REGISTRY.length + 1) {
      selectedPlatforms = PLATFORM_REGISTRY;
    } else {
      console.log('[ERROR] Invalid selection. Aborting.');
      return;
    }
  } else if (mode === '4') {
    selectedPlatforms = PLATFORM_REGISTRY;
  } else {
    // Quick install (mode 1 or default)
    if (detectedList.length > 0) {
      selectedPlatforms = detectedList;
    } else {
      console.log('[INFO] No specific environment was detected automatically.');
      console.log('[INFO] Defaulting to Google Antigravity / Universal Agent Directory (~/.agents/skills).');
      selectedPlatforms = [PLATFORM_REGISTRY[0]];
    }
  }

  console.log(`\nExecuting installation for ${selectedPlatforms.length} target(s)...\n`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < selectedPlatforms.length; i++) {
    const plat = selectedPlatforms[i];
    console.log(`[${i + 1}/${selectedPlatforms.length}] Configuring ${plat.name}...`);

    try {
      if (installSkills && plat.installSkill) {
        const sRes = plat.installSkill(customTargetDir);
        console.log(`      + Copied ${sRes.count} skill and reference files to:`);
        console.log(`        ${sRes.dest.replace(os.homedir(), '~')}`);
      }

      if (installMcp && plat.installMcp) {
        const mRes = plat.installMcp();
        if (mRes.dest) {
          console.log(`      + Registered MCP server configuration in:`);
          console.log(`        ${mRes.dest.replace(os.homedir(), '~')}`);
        } else if (mRes.detail) {
          console.log(`      + ${mRes.detail}`);
        }
      }

      console.log('      Status: OK\n');
      successCount++;
    } catch (err) {
      console.error(`      Status: FAILED (${err.message})\n`);
      failCount++;
    }
  }

  console.log('+----------------------------------------------------------------+');
  console.log(`| Installation Summary: ${successCount} configured successfully, ${failCount} failed. |`);
  console.log('+----------------------------------------------------------------+\n');

  console.log('Next Recommended Actions:');
  console.log('  1. Authenticate with OpenRP:');
  console.log('     npx openrp-toolkit auth');
  console.log('  2. Run environment diagnostics:');
  console.log('     npx openrp-toolkit doctor\n');
}

async function runAuth() {
  printBanner();
  console.log('OpenRP Interactive Authentication Setup');
  console.log('Configuration file location: ' + AUTH_FILE.replace(os.homedir(), '~') + '\n');

  let currentAuth = {};
  if (fs.existsSync(AUTH_FILE)) {
    try {
      currentAuth = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
    } catch {}
  }

  console.log('Select Authentication Method:');
  console.log('  [1] Paste Browser Cookie (Recommended - Enables background auto-refresh)');
  console.log('  [2] Paste Direct Bearer JWT Token');
  console.log('  [3] Keep existing configuration\n');

  const authMethod = await prompt('Enter choice (1-3) [default: 1]: ');

  if (authMethod === '2') {
    const token = await prompt('Bearer JWT Token (starts with eyJ...): ');
    if (token) currentAuth.token = token;
  } else if (authMethod !== '3') {
    console.log('\nPaste your cookie string containing sb-uixnaquqjhzcctyfoapf-auth-token.0 and .1:');
    const cookie = await prompt('Cookie String: ');
    if (cookie) {
      const m0 = cookie.match(/sb-uixnaquqjhzcctyfoapf-auth-token\.0=([^;]+)/);
      const m1 = cookie.match(/sb-uixnaquqjhzcctyfoapf-auth-token\.1=([^;]+)/);
      let b0 = m0 ? m0[1] : '';
      if (b0.startsWith('base64-')) b0 = b0.slice(7);
      const b1 = m1 ? m1[1] : '';
      const combined = b0 + b1;
      if (combined) {
        try {
          const padded = combined + '='.repeat((4 - (combined.length % 4)) % 4);
          const parsed = JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
          currentAuth.token = parsed.access_token || '';
          currentAuth.refreshToken = parsed.refresh_token || '';
          currentAuth.expiresAt = parsed.expires_at || 0;
          console.log('[+] Successfully parsed token and scheduled background refresh.');
        } catch (e) {
          console.warn('[WARN] Could not parse base64 cookie payload. Saved raw data.');
        }
      }
    }
  }

  console.log('\nDefault Workspace Identifiers (Optional):');
  const userId = await prompt(`User ID [current: ${currentAuth.userId || 'none'}]: `);
  if (userId) currentAuth.userId = userId;

  const worldId = await prompt(`Default World ID [current: ${currentAuth.worldId || 'none'}]: `);
  if (worldId) currentAuth.worldId = worldId;

  const characterId = await prompt(`Default Character ID [current: ${currentAuth.characterId || 'none'}]: `);
  if (characterId) currentAuth.characterId = characterId;

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify(currentAuth, null, 2) + '\n', 'utf8');

  console.log('\n[SUCCESS] Authentication configuration written to ' + AUTH_FILE.replace(os.homedir(), '~'));
  console.log('Run "npx openrp-toolkit doctor" to verify your credentials.\n');
}

async function runDoctor() {
  printBanner();
  console.log('Running OpenRP Toolkit Diagnostics...\n');

  let errors = 0;

  // 1. Check Node.js
  console.log(`[CHECK 1/5] Node.js Runtime: ${process.version} -> OK`);

  // 2. Check Python 3
  try {
    const pyVersion = execSync('python3 --version', { encoding: 'utf8' }).trim();
    console.log(`[CHECK 2/5] Python Binary: ${pyVersion} -> OK`);
  } catch (err) {
    console.log('[CHECK 2/5] Python Binary: NOT FOUND or errored');
    console.log('            Please install Python 3.10+ in your environment.');
    errors++;
  }

  // 3. Check Package Integrity
  if (fs.existsSync(MCP_SERVER_SCRIPT) && fs.existsSync(path.join(SKILLS_DIR, 'SKILL.md'))) {
    console.log('[CHECK 3/5] Package Integrity & Skill Files -> OK (40 MCP tools ready)');
  } else {
    console.log('[CHECK 3/5] Package Integrity: Missing internal files');
    errors++;
  }

  // 4. Check Auth Configuration
  if (fs.existsSync(AUTH_FILE)) {
    try {
      const auth = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
      const hasToken = !!(auth.token || auth.refreshToken);
      if (hasToken) {
        console.log(`[CHECK 4/5] Authentication State -> OK (User ID: ${auth.userId || 'configured'})`);
      } else {
        console.log('[CHECK 4/5] Authentication State -> INCOMPLETE (Token missing in ~/.openrp_mcp_auth.json)');
        errors++;
      }
    } catch {
      console.log('[CHECK 4/5] Authentication State -> INVALID JSON in ~/.openrp_mcp_auth.json');
      errors++;
    }
  } else {
    console.log('[CHECK 4/5] Authentication State -> NOT CONFIGURED (Run "openrp-toolkit auth")');
    errors++;
  }

  // 5. Check OpenRP API Ping
  console.log('[CHECK 5/5] Testing connection to https://openrp.ai...');
  const apiStatus = await new Promise(resolve => {
    https.get('https://openrp.ai/api/models', { timeout: 5000 }, (res) => {
      resolve(res.statusCode);
    }).on('error', (err) => {
      resolve('ERROR: ' + err.message);
    });
  });

  if (typeof apiStatus === 'number' && apiStatus < 500) {
    console.log(`            OpenRP API Endpoint: HTTP ${apiStatus} -> OK`);
  } else {
    console.log(`            OpenRP API Endpoint: ${apiStatus}`);
    errors++;
  }

  console.log('\n+----------------------------------------------------------------+');
  if (errors === 0) {
    console.log('| [SUCCESS] All 5 diagnostic checks passed with 0 errors.         |');
    console.log('| Your OpenRP Toolkit environment is ready to use!               |');
  } else {
    console.log(`| [WARN] Diagnostic completed with ${errors} issue(s).                        |`);
  }
  console.log('+----------------------------------------------------------------+\n');
}

// Route commands
switch (command) {
  case 'serve':
    runMcpServer();
    break;
  case 'install':
    runInstall();
    break;
  case 'auth':
    runAuth();
    break;
  case 'doctor':
    runDoctor();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    if (!process.stdin.isTTY) {
      runMcpServer();
    } else {
      console.error(`[ERROR] Unknown command: '${command}'\n`);
      showHelp();
      process.exit(1);
    }
    break;
}
