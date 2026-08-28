#!/usr/bin/env node

/**
 * OpenRP Toolkit CLI
 * Model Context Protocol (MCP) Server & AI Agent Skill Installer
 * 
 * Maintained by Kaa
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

function printHeader() {
  console.log('================================================================');
  console.log(' OpenRP Toolkit & Model Context Protocol (MCP) Server');
  console.log(' Version: 3.0.0 | Maintainer: Kaa');
  console.log('================================================================\n');
}

function showHelp() {
  printHeader();
  console.log('Usage:');
  console.log('  openrp-toolkit [command] [options]\n');
  console.log('Commands:');
  console.log('  serve                  Run MCP server in stdio mode (default)');
  console.log('  install                Install OpenRP skills and MCP config to AI CLIs');
  console.log('  auth                   Configure authentication credentials interactively');
  console.log('  doctor                 Run diagnostics on environment and connection');
  console.log('  help, --help, -h       Display this help documentation\n');
  console.log('Installation Examples:');
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

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
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
    console.warn(`[WARN] Could not parse existing config at ${configPath}. Creating a backup.`);
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

const TARGET_PLATFORMS = [
  {
    id: 'antigravity',
    name: 'Google Antigravity / Gemini CLI',
    detect: () => {
      const p1 = path.join(os.homedir(), '.gemini');
      const p2 = path.join(os.homedir(), '.agents');
      return fs.existsSync(p1) || fs.existsSync(p2);
    },
    install: () => {
      const skillDest = path.join(os.homedir(), '.agents', 'skills', 'openrp');
      copyDirSync(SKILLS_DIR, skillDest);
      console.log(`  [+] Copied skill files to: ${skillDest}`);

      const mcpConfig = path.join(os.homedir(), '.gemini', 'antigravity-cli', 'mcp_config.json');
      mergeJsonConfig(mcpConfig, ['mcpServers', 'openrp'], {
        command: 'python3',
        args: [MCP_SERVER_SCRIPT]
      });
      console.log(`  [+] Registered MCP server in: ${mcpConfig}`);
    }
  },
  {
    id: 'claude_code',
    name: 'Claude Code CLI',
    detect: () => {
      try {
        execSync('claude --version', { stdio: 'ignore' });
        return true;
      } catch {
        return fs.existsSync(path.join(os.homedir(), '.claude'));
      }
    },
    install: () => {
      const skillDest = path.join(os.homedir(), '.claude', 'skills', 'openrp');
      copyDirSync(SKILLS_DIR, skillDest);
      console.log(`  [+] Copied skill files to: ${skillDest}`);

      try {
        execSync(`claude mcp add openrp python3 "${MCP_SERVER_SCRIPT}"`, { stdio: 'ignore' });
        console.log('  [+] Executed: claude mcp add openrp ...');
      } catch {
        console.log('  [*] Note: Run "claude mcp add openrp python3 ' + MCP_SERVER_SCRIPT + '" to register MCP in Claude Code.');
      }
    }
  },
  {
    id: 'claude_desktop',
    name: 'Claude Desktop App',
    detect: () => {
      const paths = [
        path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json'),
        path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json'),
        path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json')
      ];
      return paths.some(p => fs.existsSync(p));
    },
    install: () => {
      let configPath = '';
      if (process.platform === 'darwin') {
        configPath = path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
      } else if (process.platform === 'win32') {
        configPath = path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
      } else {
        configPath = path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json');
      }

      mergeJsonConfig(configPath, ['mcpServers', 'openrp'], {
        command: 'python3',
        args: [MCP_SERVER_SCRIPT]
      });
      console.log(`  [+] Configured Claude Desktop at: ${configPath}`);
    }
  },
  {
    id: 'cursor',
    name: 'Cursor IDE',
    detect: () => {
      const p1 = path.join(os.homedir(), '.cursor');
      const p2 = path.join(process.cwd(), '.cursor');
      return fs.existsSync(p1) || fs.existsSync(p2);
    },
    install: () => {
      const projectSkill = path.join(process.cwd(), '.cursor', 'skills', 'openrp');
      copyDirSync(SKILLS_DIR, projectSkill);
      console.log(`  [+] Copied skill files to workspace: ${projectSkill}`);

      const mcpConfig = path.join(process.cwd(), '.cursor', 'mcp.json');
      mergeJsonConfig(mcpConfig, ['mcpServers', 'openrp'], {
        command: 'python3',
        args: [MCP_SERVER_SCRIPT]
      });
      console.log(`  [+] Configured workspace MCP config at: ${mcpConfig}`);
    }
  },
  {
    id: 'windsurf',
    name: 'Windsurf IDE (Codeium Cascade)',
    detect: () => {
      const p = path.join(os.homedir(), '.codeium', 'windsurf');
      return fs.existsSync(p);
    },
    install: () => {
      const mcpConfig = path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json');
      mergeJsonConfig(mcpConfig, ['mcpServers', 'openrp'], {
        command: 'python3',
        args: [MCP_SERVER_SCRIPT]
      });
      console.log(`  [+] Configured Windsurf MCP config at: ${mcpConfig}`);
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

async function runInstall() {
  printHeader();
  console.log('Select Installation Mode:');
  console.log('  [1] Auto-Detect Environments (Recommended)');
  console.log('  [2] Manual Platform Selection');
  console.log('  [3] Cancel\n');

  const mode = await prompt('Enter choice (1-3) [default: 1]: ');

  if (mode === '3') {
    console.log('[INFO] Installation cancelled.');
    return;
  }

  let selectedTargets = [];

  if (mode === '2') {
    console.log('\nAvailable Target Platforms:');
    TARGET_PLATFORMS.forEach((t, i) => {
      console.log(`  [${i + 1}] ${t.name}`);
    });
    console.log(`  [${TARGET_PLATFORMS.length + 1}] All Platforms\n`);

    const selection = await prompt(`Select platform (1-${TARGET_PLATFORMS.length + 1}): `);
    const selIndex = parseInt(selection, 10);

    if (selIndex >= 1 && selIndex <= TARGET_PLATFORMS.length) {
      selectedTargets = [TARGET_PLATFORMS[selIndex - 1]];
    } else if (selIndex === TARGET_PLATFORMS.length + 1) {
      selectedTargets = TARGET_PLATFORMS;
    } else {
      console.log('[ERROR] Invalid selection. Aborting.');
      return;
    }
  } else {
    console.log('\n[INFO] Scanning local system for AI coding platforms...');
    selectedTargets = TARGET_PLATFORMS.filter(t => t.detect());

    if (selectedTargets.length === 0) {
      console.log('[INFO] No specific environment detected automatically.');
      console.log('[INFO] Defaulting to Google Antigravity / Universal Agent directory.');
      selectedTargets = [TARGET_PLATFORMS[0]];
    } else {
      console.log(`[INFO] Detected ${selectedTargets.length} platform(s):`);
      selectedTargets.forEach(t => console.log(`  - ${t.name}`));
    }
  }

  console.log('\nExecuting installation...');
  for (const target of selectedTargets) {
    console.log(`\nInstalling for: ${target.name}`);
    try {
      target.install();
      console.log(`[SUCCESS] Installed for ${target.name}`);
    } catch (err) {
      console.error(`[ERROR] Failed installing for ${target.name}:`, err.message);
    }
  }

  console.log('\n================================================================');
  console.log(' [SUCCESS] OpenRP Toolkit installation completed successfully!');
  console.log('================================================================\n');
  console.log('Next steps:');
  console.log('  1. Configure your OpenRP credentials:');
  console.log('     npx openrp-toolkit auth');
  console.log('  2. Verify your installation and tool connectivity:');
  console.log('     npx openrp-toolkit doctor\n');
}

async function runAuth() {
  printHeader();
  console.log('OpenRP Interactive Authentication Setup');
  console.log('Credentials will be saved securely to: ' + AUTH_FILE + '\n');

  let currentAuth = {};
  if (fs.existsSync(AUTH_FILE)) {
    try {
      currentAuth = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
    } catch {}
  }

  console.log('Authentication Method:');
  console.log('  [1] Paste Browser Cookie (Recommended - Enables background auto-refresh)');
  console.log('  [2] Paste Direct Bearer JWT Token');
  console.log('  [3] Keep existing configuration\n');

  const authMethod = await prompt('Select authentication method (1-3) [default: 1]: ');

  if (authMethod === '2') {
    const token = await prompt('Enter Bearer JWT Token (starts with eyJ...): ');
    if (token) currentAuth.token = token;
  } else if (authMethod !== '3') {
    console.log('\nPaste your cookie string containing sb-uixnaquqjhzcctyfoapf-auth-token.0 and .1:');
    const cookie = await prompt('Cookie: ');
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
          console.log('[+] Successfully extracted JWT and refresh token from cookie.');
        } catch (e) {
          console.warn('[WARN] Failed to parse base64 cookie payload. Saved raw token.');
        }
      }
    }
  }

  console.log('\nDefault Resource IDs (Optional - can be left blank):');
  const userId = await prompt(`User ID [current: ${currentAuth.userId || 'none'}]: `);
  if (userId) currentAuth.userId = userId;

  const worldId = await prompt(`Default World ID [current: ${currentAuth.worldId || 'none'}]: `);
  if (worldId) currentAuth.worldId = worldId;

  const characterId = await prompt(`Default Character ID [current: ${currentAuth.characterId || 'none'}]: `);
  if (characterId) currentAuth.characterId = characterId;

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify(currentAuth, null, 2) + '\n', 'utf8');

  console.log('\n[SUCCESS] Authentication state saved successfully to ' + AUTH_FILE);
  console.log('Run "npx openrp-toolkit doctor" to test your credentials.\n');
}

async function runDoctor() {
  printHeader();
  console.log('Running OpenRP Toolkit Environment & Connectivity Diagnostics...\n');

  let errors = 0;

  // 1. Check Node.js
  console.log(`[CHECK 1/5] Node.js Runtime: ${process.version} -> OK`);

  // 2. Check Python 3
  try {
    const pyVersion = execSync('python3 --version', { encoding: 'utf8' }).trim();
    console.log(`[CHECK 2/5] Python Binary: ${pyVersion} -> OK`);
  } catch (err) {
    console.log('[CHECK 2/5] Python Binary: NOT FOUND or errored');
    console.log('            Please install Python 3.10+ in your system.');
    errors++;
  }

  // 3. Check Files
  if (fs.existsSync(MCP_SERVER_SCRIPT) && fs.existsSync(path.join(SKILLS_DIR, 'SKILL.md'))) {
    console.log('[CHECK 3/5] Package Integrity & Skill Files -> OK');
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
        console.log(`[CHECK 4/5] Authentication Credentials -> OK (User ID: ${auth.userId || 'configured'})`);
      } else {
        console.log('[CHECK 4/5] Authentication Credentials -> INCOMPLETE (Token is missing)');
        errors++;
      }
    } catch {
      console.log('[CHECK 4/5] Authentication Credentials -> INVALID JSON in ' + AUTH_FILE);
      errors++;
    }
  } else {
    console.log('[CHECK 4/5] Authentication Credentials -> NOT CONFIGURED (Run "openrp-toolkit auth")');
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
    console.log(`            OpenRP API Reachability: Status ${apiStatus} -> OK`);
  } else {
    console.log(`            OpenRP API Reachability: ${apiStatus}`);
    errors++;
  }

  console.log('\n================================================================');
  if (errors === 0) {
    console.log(' [SUCCESS] All diagnostic checks passed (0 errors).');
    console.log(' Your OpenRP Toolkit is fully operational!');
  } else {
    console.log(` [WARN] Diagnostic completed with ${errors} issue(s).`);
    console.log(' Please resolve the noted items above.');
  }
  console.log('================================================================\n');
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
    // If unknown command, check if called via MCP stdio
    if (!process.stdin.isTTY) {
      runMcpServer();
    } else {
      console.error(`[ERROR] Unknown command: '${command}'\n`);
      showHelp();
      process.exit(1);
    }
    break;
}
