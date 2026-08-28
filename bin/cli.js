#!/usr/bin/env node

/**
 * OpenRP Toolkit CLI
 * Model Context Protocol (MCP) Server & AI Agent Skill Installer
 * Pure Node.js Edition - Zero External Dependencies
 * 
 * Maintainer: Kaa (OpenRP Community Creator)
 * Platform: https://openrp.ai
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');
const readline = require('readline');
const https = require('https');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const MCP_SERVER_SCRIPT = path.join(PACKAGE_ROOT, 'mcp', 'server.js');
const SKILLS_DIR = path.join(PACKAGE_ROOT, 'skills', 'openrp');
const AUTH_FILE = path.join(os.homedir(), '.openrp_mcp_auth.json');

const args = process.argv.slice(2);
const command = args[0] || 'serve';

function printBanner() {
  console.log('┌  OpenRP Toolkit & MCP Suite (v3.0.0)');
  console.log('│  Maintainer: Kaa (OpenRP Community Creator)');
  console.log('│  Platform: https://openrp.ai');
  console.log('└───────────────────────────────────────────────────────────────\n');
}

function showHelp() {
  printBanner();
  console.log('Usage:');
  console.log('  openrp-toolkit <command> [options]\n');
  console.log('Commands:');
  console.log('  add, install           Interactive installer for AI assistants & CLIs');
  console.log('  list                   List all 47 MCP tools, skills, and references');
  console.log('  auth                   Interactive setup for OpenRP authentication');
  console.log('  doctor                 Run diagnostics on Node runtime, config, and OpenRP API');
  console.log('  serve                  Launch stdio MCP server (used by MCP clients)');
  console.log('  help, --help, -h       Display this help documentation\n');
  console.log('Quick Examples:');
  console.log('  npx openrp-toolkit add');
  console.log('  npx openrp-toolkit list');
  console.log('  npx openrp-toolkit auth');
  console.log('  npx openrp-toolkit doctor\n');
}

function runMcpServer() {
  if (fs.existsSync(MCP_SERVER_SCRIPT)) {
    require(MCP_SERVER_SCRIPT);
  } else {
    console.error(`[ERROR] MCP server script not found at: ${MCP_SERVER_SCRIPT}`);
    process.exit(1);
  }
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
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
}

function getClaudeDesktopConfigPath() {
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  } else if (process.platform === 'win32') {
    return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Claude', 'claude_desktop_config.json');
  } else {
    return path.join(os.homedir(), '.config', 'Claude', 'claude_desktop_config.json');
  }
}

const PLATFORMS = [
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
        command: 'node',
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
        execSync(`claude mcp add openrp node "${MCP_SERVER_SCRIPT}"`, { stdio: 'ignore' });
        return { type: 'mcp', detail: 'Executed: claude mcp add openrp ...' };
      } catch {
        return { type: 'mcp', detail: `Manual: claude mcp add openrp node "${MCP_SERVER_SCRIPT}"` };
      }
    }
  },
  {
    id: 'codex',
    name: 'OpenAI Codex CLI / OpenAI Agents',
    detailPath: path.join(os.homedir(), '.codex', 'skills', 'openrp'),
    detect: () => {
      const p1 = path.join(os.homedir(), '.codex');
      const p2 = path.join(os.homedir(), '.openai');
      return fs.existsSync(p1) || fs.existsSync(p2);
    },
    installSkill: (targetDir) => {
      const dest = targetDir || path.join(os.homedir(), '.codex', 'skills', 'openrp');
      const count = copyDirSync(SKILLS_DIR, dest);
      return { type: 'skill', count, dest };
    },
    installMcp: () => {
      const mcpConfig = path.join(os.homedir(), '.codex', 'mcp.json');
      mergeJsonConfig(mcpConfig, ['mcpServers', 'openrp'], {
        command: 'node',
        args: [MCP_SERVER_SCRIPT]
      });
      return { type: 'mcp', dest: mcpConfig };
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
        command: 'node',
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
    installSkill: (targetDir) => {
      const dest = targetDir || path.join(os.homedir(), '.codeium', 'windsurf', 'skills', 'openrp');
      const count = copyDirSync(SKILLS_DIR, dest);
      return { type: 'skill', count, dest };
    },
    installMcp: () => {
      const mcpConfig = path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json');
      mergeJsonConfig(mcpConfig, ['mcpServers', 'openrp'], {
        command: 'node',
        args: [MCP_SERVER_SCRIPT]
      });
      return { type: 'mcp', dest: mcpConfig };
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
        command: 'node',
        args: [MCP_SERVER_SCRIPT]
      });
      return { type: 'mcp', dest: configPath };
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

function renderDetectionScan() {
  console.log('◇  Scanning environment for AI assistants and agent CLIs...\n');

  const scanResults = [];
  for (const plat of PLATFORMS) {
    const isDetected = plat.detect();
    scanResults.push({ platform: plat, detected: isDetected });

    const statusBadge = isDetected ? '[DETECTED] ' : '[NOT FOUND]';
    const marker = isDetected ? '●' : '○';
    const nameStr = plat.name.padEnd(34);
    const shortPath = plat.detailPath.replace(os.homedir(), '~');
    console.log(`   ${marker} ${nameStr} ${statusBadge} ${shortPath}`);
  }

  const detectedCount = scanResults.filter(r => r.detected).length;
  console.log(`\n│  Found ${detectedCount} detected environment(s).\n`);
  return scanResults;
}

async function runInstall() {
  printBanner();
  
  const scanResults = renderDetectionScan();
  const detectedList = scanResults.filter(r => r.detected).map(r => r.platform);

  console.log('◆  Select installation mode:');
  console.log(`   [1] Quick Add (Install to all ${detectedList.length} detected platforms)`);
  console.log('   [2] Custom Selection (Choose specific AI tools from list)');
  console.log('   [3] Install Skill Files Only (Custom target folder)');
  console.log('   [4] Install Everywhere (All 6 supported platforms)');
  console.log('   [5] Cancel\n');

  const mode = await prompt('   Select option (1-5) [default: 1]: ');

  if (mode === '5') {
    console.log('\n└  Installation cancelled.');
    return;
  }

  let selectedPlatforms = [];
  let customTargetDir = null;

  if (mode === '3') {
    console.log('\n◇  Install to Custom Directory:');
    const customPath = await prompt('   Target folder path [default: ./openrp-skill]: ');
    customTargetDir = path.resolve(customPath || './openrp-skill');
    selectedPlatforms = [{
      name: `Custom Directory (${customTargetDir})`,
      installSkill: () => {
        const count = copyDirSync(SKILLS_DIR, customTargetDir);
        return { type: 'skill', count, dest: customTargetDir };
      },
      installMcp: null
    }];
  } else if (mode === '2') {
    console.log('\n◇  Available Platforms:');
    PLATFORMS.forEach((p, i) => {
      const isDet = p.detect() ? '(Detected)' : '';
      console.log(`   [${i + 1}] ${p.name.padEnd(35)} ${isDet}`);
    });
    console.log(`   [${PLATFORMS.length + 1}] All Platforms\n`);

    const sel = await prompt(`   Choose platform number (1-${PLATFORMS.length + 1}): `);
    const selIdx = parseInt(sel, 10);

    if (selIdx >= 1 && selIdx <= PLATFORMS.length) {
      selectedPlatforms = [PLATFORMS[selIdx - 1]];
    } else if (selIdx === PLATFORMS.length + 1) {
      selectedPlatforms = PLATFORMS;
    } else {
      console.log('\n└  Invalid selection. Aborted.');
      return;
    }
  } else if (mode === '4') {
    selectedPlatforms = PLATFORMS;
  } else {
    selectedPlatforms = detectedList.length > 0 ? detectedList : PLATFORMS;
  }

  console.log('\n◇  Installing OpenRP Toolkit across selected platforms...\n');

  for (const plat of selectedPlatforms) {
    console.log(`┌─ Installing to: ${plat.name}`);

    if (plat.installSkill) {
      try {
        const res = plat.installSkill(customTargetDir);
        const shortDest = res.dest.replace(os.homedir(), '~');
        console.log(`│  ✓ Skill files copied: ${res.count} files -> ${shortDest}`);
      } catch (err) {
        console.log(`│  ✗ Failed to install skill: ${err.message}`);
      }
    }

    if (plat.installMcp) {
      try {
        const res = plat.installMcp();
        const shortDest = res.dest ? res.dest.replace(os.homedir(), '~') : res.detail;
        console.log(`│  ✓ MCP config updated -> ${shortDest}`);
      } catch (err) {
        console.log(`│  ✗ Failed to configure MCP: ${err.message}`);
      }
    }

    console.log('└───────────────────────────────────────────────────────────\n');
  }

  console.log('◆  Checking authentication credentials...');
  if (!fs.existsSync(AUTH_FILE)) {
    console.log('│  No saved credentials found in ~/.openrp_mcp_auth.json.');
    const setupAuth = await prompt('│  Would you like to configure your OpenRP token now? (y/n) [default: y]: ');
    if (setupAuth.toLowerCase() !== 'n') {
      await runAuth();
    }
  } else {
    console.log('│  ✓ Active credentials found at ~/.openrp_mcp_auth.json');
  }

  console.log('\n┌───────────────────────────────────────────────────────────┐');
  console.log('│ [SUCCESS] OpenRP Toolkit installed successfully!          │');
  console.log('│                                                           │');
  console.log('│ Test diagnostic:  npx openrp-toolkit doctor               │');
  console.log('│ Browse 47 tools:  npx openrp-toolkit list                 │');
  console.log('│ Update auth:      npx openrp-toolkit auth                 │');
  console.log('└───────────────────────────────────────────────────────────┘\n');
}

function runList() {
  printBanner();
  console.log('OpenRP Toolkit Catalog (47 MCP Tools & Native Skills)\n');

  const categories = [
    {
      name: '1. Authentication & Session (3 Tools)',
      tools: [
        ['openrp_set_auth', 'Save/update API token, refresh token, and context IDs'],
        ['openrp_refresh_token', 'Manually trigger Supabase JWT token refresh'],
        ['openrp_get_me', 'Get authenticated profile, subscription, and credits']
      ]
    },
    {
      name: '2. World Management (6 Tools)',
      tools: [
        ['openrp_list_my_worlds', 'List all worlds owned by user with pagination'],
        ['openrp_get_world', 'Get detailed world settings, statistics, and metadata'],
        ['openrp_create_world', 'Create a new World with verified payload format'],
        ['openrp_update_world', 'Update world metadata, tags, and visibility'],
        ['openrp_update_world_readme', 'Update world Markdown documentation up to 5000 words'],
        ['openrp_delete_world', 'Permanently delete a world and its entities']
      ]
    },
    {
      name: '3. Lorebook System & Exclusive Access (7 Tools)',
      tools: [
        ['openrp_list_lores', 'List all lorebook entries in world'],
        ['openrp_get_lore', 'Get detailed lore entry content and metadata by ID/handle'],
        ['openrp_create_lore', 'Create factual lorebook entry with optional isExclusive flag'],
        ['openrp_update_lore', 'Update existing lorebook entry in-place'],
        ['openrp_delete_lore', 'Delete a lorebook entry'],
        ['openrp_list_lore_characters', 'List characters with access to exclusive lore'],
        ['openrp_list_character_lores', 'List all exclusive lores assigned to a character']
      ]
    },
    {
      name: '4. Character Studio & Factions (9 Tools)',
      tools: [
        ['openrp_list_characters', 'List all characters residing in world'],
        ['openrp_get_character', 'Get detailed character persona, greetings, and dialogs'],
        ['openrp_create_character', 'Create new character with full persona and settings'],
        ['openrp_update_character', 'Update character persona, status, and appearance'],
        ['openrp_delete_character', 'Delete character from world'],
        ['openrp_list_character_groups', 'List all faction/group hierarchies in world'],
        ['openrp_create_character_group', 'Create character group/faction in world'],
        ['openrp_update_character_group', 'Update character group via PATCH'],
        ['openrp_delete_character_group', 'Delete character group via DELETE']
      ]
    },
    {
      name: '5. Prompt Template System (4 Tools)',
      tools: [
        ['openrp_list_prompts', 'List all prompt templates in world'],
        ['openrp_get_prompt', 'Get detailed prompt template nodes'],
        ['openrp_create_prompt', 'Create new system prompt template'],
        ['openrp_delete_prompt', 'Delete prompt template from world']
      ]
    },
    {
      name: '6. Behavior Pipeline Engine (7 Tools)',
      tools: [
        ['openrp_list_behaviors', 'List all behavior pipeline graphs in world'],
        ['openrp_get_behavior', 'Get full Behavior Graph JSON (nodes, edges)'],
        ['openrp_update_behavior', 'In-place update of behavior graph without losing bindings'],
        ['openrp_edit_behavior_node', 'Granular in-place edit of single node data'],
        ['openrp_deploy_behavior', 'Deploy behavior graph and auto-attach to character'],
        ['openrp_delete_behavior', 'Delete behavior graph from world'],
        ['openrp_attach_behavior_to_character', 'Attach behavior with auto-detach of old bindings']
      ]
    },
    {
      name: '7. Tracing & Debugging (3 Tools)',
      tools: [
        ['openrp_search_behavior_executions', 'Search behavior execution history runs'],
        ['openrp_get_behavior_execution', 'Get execution status, timestamps, and trigger message'],
        ['openrp_get_behavior_node_executions', 'Get step-by-step resolved node inputs, outputs, and errors']
      ]
    },
    {
      name: '8. Chat & Live Messaging (5 Tools)',
      tools: [
        ['openrp_create_chat', 'Create/retrieve 1-on-1 chat session with character'],
        ['openrp_list_chats', 'List active chatrooms, group chats, and metadata'],
        ['openrp_get_chat', 'Get detailed metadata for specific chat room'],
        ['openrp_get_chat_messages', 'Get message history for chat room'],
        ['openrp_send_message', 'Insert new chat message into room directly via API']
      ]
    },
    {
      name: '9. Discovery & AI Models (3 Tools)',
      tools: [
        ['openrp_list_models', 'List 38+ Foundation AI Models (Claude, GPT, Gemini, DeepSeek)'],
        ['openrp_discover_worlds', 'Search public community worlds on OpenRP explore page'],
        ['openrp_raw_api', 'Universal Gateway to call any OpenRP REST API endpoint directly']
      ]
    }
  ];

  categories.forEach(cat => {
    console.log(`◆  ${cat.name}`);
    cat.tools.forEach(([name, desc]) => {
      console.log(`   ● ${name.padEnd(38)} ${desc}`);
    });
    console.log('');
  });

  console.log('Skill Reference Guides (Markdown):');
  console.log('   ◇ SKILL.md                          Master OpenRP AI agent guide');
  console.log('   ◇ references/behavior_nodes.md      Complete specification for all 22 behavior nodes');
  console.log('   ◇ references/worlds_and_characters.md Full API schemas, endpoints, and data payloads');
  console.log('   ◇ references/architecture.md        PostgreSQL schema, Git mirroring, and vector embeddings\n');
}

async function runAuth() {
  printBanner();
  console.log('OpenRP Authentication Setup\n');
  console.log('How to get your OpenRP credentials:');
  console.log('1. Open your browser and navigate to https://openrp.ai');
  console.log('2. Open Developer Tools (F12) -> Application -> Cookies');
  console.log('3. Find "sb-uixnaquqjhzcctyfoapf-auth-token" and copy its values.\n');

  let currentAuth = {};
  if (fs.existsSync(AUTH_FILE)) {
    try {
      currentAuth = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
    } catch {}
  }

  const token = await prompt(`JWT Access Token [${currentAuth.token ? 'configured' : 'none'}]: `);
  const refreshToken = await prompt(`Supabase Refresh Token [${currentAuth.refreshToken ? 'configured' : 'none'}]: `);
  const userId = await prompt(`User ID (UUID) [${currentAuth.userId || 'none'}]: `);
  const worldId = await prompt(`Default World ID (UUID) [${currentAuth.worldId || 'none'}]: `);
  const characterId = await prompt(`Default Character ID (UUID) [${currentAuth.characterId || 'none'}]: `);

  const updatedAuth = {
    token: token || currentAuth.token || '',
    refreshToken: refreshToken || currentAuth.refreshToken || '',
    userId: userId || currentAuth.userId || '',
    worldId: worldId || currentAuth.worldId || '',
    characterId: characterId || currentAuth.characterId || ''
  };

  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
  fs.writeFileSync(AUTH_FILE, JSON.stringify(updatedAuth, null, 2), 'utf8');

  console.log('\n[SUCCESS] Authentication configuration written to ' + AUTH_FILE.replace(os.homedir(), '~'));
  console.log('Run "npx openrp-toolkit doctor" to verify your credentials.\n');
}

async function runDoctor() {
  printBanner();
  console.log('Running OpenRP Toolkit Diagnostics...\n');

  let errors = 0;

  // 1. Check Node.js
  const nodeMajor = parseInt(process.version.slice(1).split('.')[0], 10);
  if (nodeMajor >= 18) {
    console.log(`[CHECK 1/4] Node.js Runtime: ${process.version} (Native fetch support) -> OK`);
  } else {
    console.log(`[CHECK 1/4] Node.js Runtime: ${process.version} (Warning: Node.js 18+ recommended)`);
  }

  // 2. Check Package Integrity
  if (fs.existsSync(MCP_SERVER_SCRIPT) && fs.existsSync(path.join(SKILLS_DIR, 'SKILL.md'))) {
    console.log('[CHECK 2/4] Package Integrity & Skill Files -> OK (47 MCP tools ready)');
  } else {
    console.log('[CHECK 2/4] Package Integrity: Missing internal files');
    errors++;
  }

  // 3. Check Auth Configuration
  if (fs.existsSync(AUTH_FILE)) {
    try {
      const auth = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
      const hasToken = !!(auth.token || auth.refreshToken);
      if (hasToken) {
        console.log(`[CHECK 3/4] Authentication State -> OK (User ID: ${auth.userId || 'configured'})`);
      } else {
        console.log('[CHECK 3/4] Authentication State -> INCOMPLETE (Token missing in ~/.openrp_mcp_auth.json)');
        errors++;
      }
    } catch {
      console.log('[CHECK 3/4] Authentication State -> INVALID JSON in ~/.openrp_mcp_auth.json');
      errors++;
    }
  } else {
    console.log('[CHECK 3/4] Authentication State -> NOT CONFIGURED (Run "openrp-toolkit auth")');
    errors++;
  }

  // 4. Check OpenRP API Ping
  console.log('[CHECK 4/4] Testing connection to https://openrp.ai...');
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

  console.log('\n┌───────────────────────────────────────────────────────────────┐');
  if (errors === 0) {
    console.log('│ [SUCCESS] All diagnostic checks passed with 0 errors.         │');
    console.log('│ Your OpenRP Toolkit environment is ready to use!              │');
  } else {
    console.log(`│ [WARN] Diagnostic completed with ${errors} issue(s).                      │`);
  }
  console.log('└───────────────────────────────────────────────────────────────┘\n');
}

// Route commands
switch (command) {
  case 'serve':
    runMcpServer();
    break;
  case 'add':
  case 'install':
    runInstall();
    break;
  case 'list':
    runList();
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
