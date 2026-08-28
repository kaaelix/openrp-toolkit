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
  console.log('┌  OpenRP Toolkit & MCP Suite (v1.2.0)');
  console.log('│  Maintainer: Kaa (https://github.com/kaaelix)');
  console.log('│  Platform: https://openrp.ai');
  console.log('└───────────────────────────────────────────────────────────────\n');
}

function showHelp() {
  printBanner();
  console.log('Usage:');
  console.log('  openrp-toolkit <command> [options]\n');
  console.log('Commands:');
  console.log('  add, install           Interactive installer for AI assistants & CLIs');
  console.log('  sync                   Synchronize skills and MCP configs to detected platforms');
  console.log('  update, upgrade        Auto-update toolkit via Git/npm and re-sync all skills');
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

function syncAntigravityMcpSchemas() {
  const mcpDir = path.join(os.homedir(), '.gemini', 'antigravity-cli', 'mcp', 'openrp');
  if (fs.existsSync(mcpDir)) {
    try {
      const serverCode = fs.readFileSync(MCP_SERVER_SCRIPT, 'utf8');
      const startIdx = serverCode.indexOf('const TOOLS = [');
      const endIdx = serverCode.indexOf('];\n\n// Helper to copy directory recursively', startIdx);
      if (startIdx !== -1 && endIdx !== -1) {
        const toolsCode = serverCode.slice(startIdx + 'const TOOLS = '.length, endIdx + 1);
        const tools = eval(toolsCode);
        for (const t of tools) {
          const schema = {
            name: t.name,
            description: t.description,
            parameters: t.inputSchema || { type: 'object', properties: {} }
          };
          fs.writeFileSync(path.join(mcpDir, t.name + '.json'), JSON.stringify(schema, null, 2));
        }
      }
    } catch (e) {}
  }
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
      syncAntigravityMcpSchemas();
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

const http = require('http');

function openBrowser(url) {
  const plat = process.platform;
  try {
    if (plat === 'darwin') execSync(`open "${url}"`, { stdio: 'ignore' });
    else if (plat === 'win32') execSync(`start "" "${url}"`, { stdio: 'ignore' });
    else execSync(`xdg-open "${url}" 2>/dev/null || termux-open-url "${url}" 2>/dev/null || true`, { stdio: 'ignore' });
  } catch (e) {}
}

function parseTokenFromRaw(input) {
  if (!input) return { token: '', refreshToken: '' };
  let str = input.trim();

  try {
    const obj = JSON.parse(str);
    if (Array.isArray(obj)) return { token: obj[0] || '', refreshToken: obj[1] || '' };
    if (obj.access_token) return { token: obj.access_token, refreshToken: obj.refresh_token || '' };
    if (obj.token) return { token: obj.token, refreshToken: obj.refreshToken || '' };
  } catch (e) {}

  if (str.includes('auth-token')) {
    const chunks = {};
    const parts = str.split(';');
    for (let part of parts) {
      part = part.trim();
      const match = part.match(/^sb-[^=]+-auth-token(?:\.(\d+))?=(.*)$/);
      if (match) {
        const idx = match[1] ? parseInt(match[1]) : 0;
        chunks[idx] = decodeURIComponent(match[2]);
      }
    }

    const keys = Object.keys(chunks).sort((a, b) => a - b);
    if (keys.length > 0) {
      let combined = keys.map(k => chunks[k]).join('');
      if (combined.startsWith('base64-')) combined = combined.slice(7);
      try {
        const jsonStr = Buffer.from(combined, 'base64').toString('utf8');
        const parsed = JSON.parse(jsonStr);
        if (parsed.access_token) {
          return {
            token: parsed.access_token,
            refreshToken: parsed.refresh_token || ''
          };
        }
      } catch (e) {
        try {
          const parsed = JSON.parse(combined);
          if (parsed.access_token) {
            return {
              token: parsed.access_token,
              refreshToken: parsed.refresh_token || ''
            };
          }
        } catch (e2) {}
      }
    }
  }

  if (str.startsWith('ey') && str.split('.').length === 3) {
    return { token: str, refreshToken: '' };
  }

  return { token: str, refreshToken: '' };
}

async function runWebLogin() {
  printBanner();
  console.log('Starting OpenRP Auth Bridge on http://127.0.0.1:45678 ...\n');

  const PORT = 45678;
  return new Promise((resolve) => {
    const server = http.createServer(async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', '*');
      res.setHeader('Access-Control-Allow-Private-Network', 'true');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // 1. Serve JavaScript file like Eruda (GET /bridge.js, /_openrp_cli_bridge.js, /openrp.js)
      if (req.url.startsWith('/bridge.js') || req.url.startsWith('/_openrp_cli_bridge.js') || req.url.startsWith('/openrp.js')) {
        const bridgeJs = `(async function openrpBridge(){try{let t='',r='',user=null;let chunks={};for(let c of document.cookie.split(';')){c=c.trim();let m=c.match(/^sb-[^=]+-auth-token(?:\\.(\\d+))?=(.*)$/);if(m){let idx=m[1]?parseInt(m[1]):0;chunks[idx]=decodeURIComponent(m[2]);}}let keys=Object.keys(chunks).sort((a,b)=>a-b);if(keys.length){let combined=keys.map(k=>chunks[k]).join('');if(combined.startsWith('base64-'))combined=combined.slice(7);try{let obj=JSON.parse(atob(combined));t=obj.access_token||'';r=obj.refresh_token||'';user=obj.user||null;}catch(e){try{let obj=JSON.parse(combined);t=obj.access_token||'';r=obj.refresh_token||'';user=obj.user||null;}catch(e2){}}}if(!t){for(let i=0;i<localStorage.length;i++){let k=localStorage.key(i);if(k&&(k.includes('auth-token')||k.includes('supabase.auth'))){try{let v=localStorage.getItem(k);if(v.startsWith('base64-'))v=atob(v.slice(7));let obj=JSON.parse(v);t=obj.access_token||(Array.isArray(obj)?obj[0]:(obj.token||''));r=obj.refresh_token||(Array.isArray(obj)?obj[1]:'');user=obj.user||null;if(t)break;}catch(e){}}}}if(!t){alert('OpenRP session not found. Please log in first.');return;}if(!user){try{let res=await fetch('/api/users/me',{headers:{'Authorization':'Bearer '+t}});let j=await res.json();if(j&&j.data)user=j.data;}catch(e){}}let name=(user&&(user.user_metadata?.full_name||user.name||user.displayName||user.handle))||'Creator';let handle=(user&&(user.handle?('@'+user.handle):(user.user_metadata?.email?user.user_metadata.email:'')))||'';let av=(user&&(user.user_metadata?.avatar_url||user.avatar||user.avatarUrl||user.user_metadata?.picture))||'';let ex=document.getElementById('openrp-auth-modal');if(ex)ex.remove();let o=document.createElement('div');o.id='openrp-auth-modal';o.style.cssText='position:fixed;inset:0;z-index:99999999;background:rgba(0,0,0,0.85);backdrop-filter:blur(12px);display:flex;align-items:center;justify-content:center;padding:16px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif;color:#fafafa;';let c=document.createElement('div');c.style.cssText='background:#09090b;border:1px solid #27272a;border-radius:16px;padding:32px 28px;max-width:380px;width:100%;text-align:center;box-shadow:0 25px 50px -12px rgba(0,0,0,0.9);box-sizing:border-box;';let badge='<div style="display:inline-block;padding:4px 12px;background:#18181b;border:1px solid #27272a;border-radius:9999px;font-size:11px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:20px;">OpenRP CLI Auth</div>';let avatarHtml='<div style="width:76px;height:76px;margin:0 auto 16px;position:relative;">'+(av?'<img src="'+av+'" style="width:100%;height:100%;border-radius:50%;object-fit:cover;border:2px solid #fafafa;">':'<div style="width:100%;height:100%;border-radius:50%;background:#18181b;border:2px solid #fafafa;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:700;color:#fafafa;">'+(name[0]||'O').toUpperCase()+'</div>')+'</div>';let titleHtml='<div style="font-size:18px;font-weight:700;color:#fafafa;margin-bottom:2px;">'+name+'</div>'+(handle?'<div style="font-size:13px;color:#a1a1aa;font-family:monospace;margin-bottom:16px;">'+handle+'</div>':'<div style="margin-bottom:16px;"></div>');let questionHtml='<div style="font-size:15px;font-weight:600;color:#fafafa;margin-bottom:6px;">Is this you?</div><div style="font-size:13px;color:#71717a;line-height:1.5;margin-bottom:24px;">Authorize the OpenRP CLI & MCP Suite on this device.</div>';let btnsHtml='<div style="display:flex;flex-direction:column;gap:10px;"><button id="openrp-confirm-btn" style="background:#fafafa;color:#18181b;font-weight:600;font-size:13px;padding:11px 18px;border-radius:8px;border:none;cursor:pointer;width:100%;">Yes, Authorize</button><button id="openrp-cancel-btn" style="background:#18181b;color:#a1a1aa;font-weight:500;font-size:13px;padding:10px 18px;border-radius:8px;border:1px solid #27272a;cursor:pointer;width:100%;">Cancel</button></div>';c.innerHTML=badge+avatarHtml+titleHtml+questionHtml+btnsHtml;o.appendChild(c);document.body.appendChild(o);document.getElementById('openrp-cancel-btn').onclick=()=>o.remove();document.getElementById('openrp-confirm-btn').onclick=async()=>{let btn=document.getElementById('openrp-confirm-btn');btn.disabled=true;btn.textContent='Connecting...';try{await fetch('http://127.0.0.1:${PORT}/_openrp_cli_auth',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:t,refreshToken:r,user:user})});c.innerHTML='<div style="width:48px;height:48px;border-radius:50%;background:#fafafa;color:#18181b;font-size:20px;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">OK</div><div style="font-size:18px;font-weight:700;margin-bottom:8px;color:#fafafa;">Authorized</div><div style="font-size:13px;color:#a1a1aa;margin-bottom:20px;">Credentials saved to CLI. You can close this window.</div><button onclick="document.getElementById(\\'openrp-auth-modal\\').remove()" style="background:#fafafa;color:#18181b;font-weight:600;font-size:13px;padding:9px 18px;border-radius:8px;border:none;cursor:pointer;">Close</button>';}catch(e){location.href='http://127.0.0.1:${PORT}/?token='+encodeURIComponent(t)+'&refreshToken='+encodeURIComponent(r);}};}catch(err){alert('OpenRP Auth Error: '+err.message);}})();`;
        res.writeHead(200, {
          'Content-Type': 'application/javascript; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Private-Network': 'true'
        });
        res.end(bridgeJs);
        return;
      }

      // Handle token received via GET query param (from browser redirect)
      const reqUrl = new URL(req.url, `http://127.0.0.1:${PORT}`);
      const queryToken = reqUrl.searchParams.get('token') || reqUrl.searchParams.get('access_token');
      if (queryToken) {
        let userAccount = {};
        try {
          const meRes = await fetch('https://openrp.ai/api/users/me', {
            headers: { 'Authorization': `Bearer ${queryToken}` }
          });
          userAccount = (await meRes.json()).data || {};
        } catch (e) {}

        const authUid = userAccount.id || 'authenticated-user';
        let worldId = '';
        let characterId = '';
        try {
          const worldsRes = await fetch(`https://openrp.ai/api/users/${authUid}/worlds?limit=1`, {
            headers: { 'Authorization': `Bearer ${queryToken}` }
          });
          const worldsData = (await worldsRes.json()).data;
          const worlds = worldsData?.data || (Array.isArray(worldsData) ? worldsData : []);
          if (worlds.length > 0) {
            worldId = worlds[0].id;
            const charsRes = await fetch(`https://openrp.ai/api/users/${authUid}/worlds/${worldId}/characters?limit=1`, {
              headers: { 'Authorization': `Bearer ${queryToken}` }
            });
            const charsData = (await charsRes.json()).data;
            const chars = charsData?.data || (Array.isArray(charsData) ? charsData : []);
            if (chars.length > 0) characterId = chars[0].id;
          }
        } catch (e) {}

        const authPayload = {
          token: queryToken,
          refreshToken: reqUrl.searchParams.get('refreshToken') || '',
          userId: authUid,
          userName: userAccount.name || userAccount.handle || 'OpenRP Creator',
          worldId,
          characterId,
          expiresAt: Math.floor(Date.now() / 1000) + 3600
        };

        fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
        fs.writeFileSync(AUTH_FILE, JSON.stringify(authPayload, null, 2), 'utf8');

        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenRP - Authorized</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0b0f19;
      color: #fff;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }
    .card {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 36px 32px;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 20px;
    }
    .status-circle {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      background: #ffffff;
      color: #000000;
      font-size: 20px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 18px;
    }
    h1 { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 6px; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 20px; }
    .user-box {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 20px;
      font-family: monospace;
      font-size: 13px;
      color: #fff;
    }
    .footnote { font-size: 12px; color: #64748b; margin-bottom: 0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">OpenRP CLI Auth</div>
    <div class="status-circle">OK</div>
    <h1>Authorization Granted</h1>
    <p>Your OpenRP session has been connected to CLI and MCP Suite on this device.</p>
    <div class="user-box">${authPayload.userName} (${authPayload.userId})</div>
    <p class="footnote">You can safely close this window and return to your terminal.</p>
  </div>
</body>
</html>`);

        console.log('\n+---------------------------------------------------------------+');
        console.log(`| [SUCCESS] Authenticated as: ${authPayload.userName.padEnd(33)} |`);
        console.log(`| User ID:         ${authPayload.userId.padEnd(44)} |`);
        console.log(`| Target World:    ${(authPayload.worldId || 'Auto-created').padEnd(44)} |`);
        console.log('| Credentials written to: ~/.openrp_mcp_auth.json               |');
        console.log('+---------------------------------------------------------------+\n');

        setTimeout(() => {
          server.close();
          resolve();
        }, 1000);
        return;
      }

      // Handle POST payload from fetch
      if (req.url.startsWith('/_openrp_cli_auth') && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body);
            let token = payload.token || payload.access_token;
            let refreshToken = payload.refreshToken || payload.refresh_token;

            if (!token) throw new Error('No valid OpenRP session token found');

            let userAccount = payload.user || {};
            if (!userAccount.id) {
              try {
                const meRes = await fetch('https://openrp.ai/api/users/me', {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                userAccount = (await meRes.json()).data || {};
              } catch (e) {}
            }

            const authUid = userAccount.id || 'authenticated-user';

            let worldId = '';
            let characterId = '';
            try {
              const worldsRes = await fetch(`https://openrp.ai/api/users/${authUid}/worlds?limit=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              const worldsData = (await worldsRes.json()).data;
              const worlds = worldsData?.data || (Array.isArray(worldsData) ? worldsData : []);
              if (worlds.length > 0) {
                worldId = worlds[0].id;
                const charsRes = await fetch(`https://openrp.ai/api/users/${authUid}/worlds/${worldId}/characters?limit=1`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                const charsData = (await charsRes.json()).data;
                const chars = charsData?.data || (Array.isArray(charsData) ? charsData : []);
                if (chars.length > 0) characterId = chars[0].id;
              }
            } catch (e) {}

            const authPayload = {
              token,
              refreshToken: refreshToken || '',
              userId: authUid,
              userName: userAccount.name || userAccount.handle || 'OpenRP Creator',
              worldId,
              characterId,
              expiresAt: Math.floor(Date.now() / 1000) + 3600
            };

            fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
            fs.writeFileSync(AUTH_FILE, JSON.stringify(authPayload, null, 2), 'utf8');

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              success: true,
              message: 'Authentication successful!',
              userName: authPayload.userName,
              userId: authPayload.userId,
              worldId: authPayload.worldId
            }));

            console.log('\n+---------------------------------------------------------------+');
            console.log(`| [SUCCESS] Authenticated as: ${authPayload.userName.padEnd(33)} |`);
            console.log(`| User ID:         ${authPayload.userId.padEnd(44)} |`);
            console.log(`| Target World:    ${(authPayload.worldId || 'Auto-created').padEnd(44)} |`);
            console.log('| Credentials written to: ~/.openrp_mcp_auth.json               |');
            console.log('+---------------------------------------------------------------+\n');

            setTimeout(() => {
              server.close();
              resolve();
            }, 1000);
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: true, message: err.message }));
          }
        });
        return;
      }

      // Eruda Style Script Loader for Bookmarklet and Console
      const erudaStyleSnippet = `javascript:(function(){var s=document.createElement('script');s.src='http://127.0.0.1:${PORT}/bridge.js';document.body.appendChild(s);})();`;

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OpenRP Auth Gateway</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0b0f19;
      color: #fff;
      font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px 16px;
    }
    .card {
      background: #0f172a;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 32px 28px;
      max-width: 460px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .badge {
      display: inline-block;
      padding: 4px 12px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 20px;
    }
    h1 { font-size: 20px; font-weight: 700; color: #fff; margin-bottom: 6px; }
    p.sub { font-size: 13px; color: #94a3b8; line-height: 1.5; margin-bottom: 24px; }
    .step {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
      text-align: left;
    }
    .step-title { font-size: 13px; font-weight: 600; color: #fff; margin-bottom: 4px; }
    .step-desc { font-size: 12px; color: #64748b; line-height: 1.4; margin-bottom: 12px; }
    .btn-white {
      display: flex; align-items: center; justify-content: center;
      background: #fff; color: #000; font-weight: 600; font-size: 13px;
      padding: 10px 16px; border-radius: 8px; text-decoration: none;
      cursor: grab; border: none; width: 100%;
    }
    .btn-dark {
      display: flex; align-items: center; justify-content: center;
      background: rgba(255, 255, 255, 0.06); color: #fff; font-weight: 500; font-size: 13px;
      padding: 10px 16px; border-radius: 8px; text-decoration: none;
      border: 1px solid rgba(255, 255, 255, 0.1); width: 100%;
    }
    .code-preview {
      background: #09090b;
      border: 1px solid #27272a;
      border-radius: 8px;
      padding: 10px 12px;
      font-family: monospace;
      font-size: 11px;
      color: #fafafa;
      word-break: break-all;
      text-align: left;
      margin-bottom: 10px;
    }
    .copy-box {
      display: flex; align-items: center; justify-content: space-between;
      background: rgba(255, 255, 255, 0.04); border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px; padding: 10px 14px; font-size: 12px; color: #94a3b8; cursor: pointer;
      margin-top: 6px;
    }
    .copy-box:hover { border-color: rgba(255, 255, 255, 0.2); color: #fff; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">OpenRP Auth Gateway</div>
    <h1>Connect CLI & MCP</h1>
    <p class="sub">Authorize local toolkit using your active OpenRP.ai session</p>

    <!-- Step 1: Open openrp.ai -->
    <div class="step">
      <div class="step-title">1. Open OpenRP.ai</div>
      <div class="step-desc">Open openrp.ai in a browser tab where you are already logged in.</div>
      <a class="btn-dark" href="https://openrp.ai" target="_blank">
        Open https://openrp.ai
      </a>
    </div>

    <!-- Step 2: Run bookmarklet -->
    <div class="step">
      <div class="step-title">2. Run Bookmarklet / Script (Eruda Style)</div>
      <div class="step-desc">Drag this button to Bookmarks Bar, or copy the code below and run it in <b>openrp.ai</b> Console:</div>
      <a class="btn-white" id="bookmarkletLink" href="#">
        [ OpenRP CLI Auth ]
      </a>
      <div class="code-preview" style="margin-top: 12px;">javascript:(function(){var s=document.createElement('script');s.src='http://127.0.0.1:${PORT}/bridge.js';document.body.appendChild(s);})();</div>
      <div class="copy-box" onclick="copyCode()">
        <span>Copy Script for Console</span>
        <span id="copyText" style="font-weight: 600; color: #fff;">Copy</span>
      </div>
    </div>
  </div>

  <script>
    const code = ${JSON.stringify(erudaStyleSnippet)};
    document.getElementById('bookmarkletLink').href = code;

    function copyCode() {
      navigator.clipboard.writeText(code);
      const el = document.getElementById('copyText');
      el.innerText = 'Copied';
      setTimeout(() => { el.innerText = 'Copy'; }, 2000);
    }
    try { navigator.clipboard.writeText(code); } catch(e){}
  </script>
</body>
</html>`);
    });

    server.listen(PORT, '127.0.0.1', () => {
      const url = `http://127.0.0.1:${PORT}`;
      console.log(`Local auth bridge listening on: ${url}`);
      console.log('Opening browser to authenticate on https://openrp.ai...');
      openBrowser(url);
    });
  });
}

async function runAuth() {
  printBanner();
  console.log('OpenRP Authentication Setup\n');
  console.log('Select Authentication Mode:');
  console.log('   [1] Web Browser 1-Click Auto-Sync (Recommended)');
  console.log('   [2] Manual Cookie / JWT Token Paste\n');

  const mode = await prompt('   Choose option (1-2) [default: 1]: ');

  if (mode === '2') {
    let currentAuth = {};
    if (fs.existsSync(AUTH_FILE)) {
      try { currentAuth = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8')); } catch {}
    }

    const raw = await prompt(`Paste JWT Token or Cookie String: `);
    const parsed = parseTokenFromRaw(raw);
    const token = parsed.token || currentAuth.token || '';

    // Fetch user profile from OpenRP API
    let userAccount = {};
    try {
      const meRes = await fetch('https://openrp.ai/api/users/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      userAccount = (await meRes.json()).data || {};
    } catch (e) {}

    const authUid = userAccount.id || currentAuth.userId || '';

    const updatedAuth = {
      token: token,
      refreshToken: parsed.refreshToken || currentAuth.refreshToken || '',
      userId: authUid,
      userName: userAccount.name || currentAuth.userName || '',
      worldId: currentAuth.worldId || '',
      characterId: currentAuth.characterId || '',
      expiresAt: Math.floor(Date.now() / 1000) + 3600
    };

    fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true });
    fs.writeFileSync(AUTH_FILE, JSON.stringify(updatedAuth, null, 2), 'utf8');

    console.log('\n[SUCCESS] Authentication written to ' + AUTH_FILE.replace(os.homedir(), '~'));
    console.log('Run "npx openrp-toolkit doctor" to verify your credentials.\n');
  } else {
    await runWebLogin();
  }
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

function runSync(silent = false) {
  if (!silent) printBanner();
  if (!silent) console.log('◇  Synchronizing OpenRP Skills and MCP server configs...\n');

  const detectedList = PLATFORMS.filter(p => p.detect());
  let syncedCount = 0;

  for (const plat of detectedList) {
    if (plat.installSkill) {
      try {
        const res = plat.installSkill();
        const shortDest = res.dest.replace(os.homedir(), '~');
        if (!silent) console.log(`   ✓ Synced ${res.count} skill files -> ${plat.name} (${shortDest})`);
        syncedCount++;
      } catch (err) {
        if (!silent) console.log(`   ✗ Failed to sync skill to ${plat.name}: ${err.message}`);
      }
    }
    if (plat.installMcp) {
      try {
        const res = plat.installMcp();
        const shortDest = res.dest ? res.dest.replace(os.homedir(), '~') : res.detail;
        if (!silent) console.log(`   ✓ Synced MCP config -> ${plat.name} (${shortDest})`);
      } catch (err) {}
    }
  }

  if (!silent) {
    console.log(`\n[SUCCESS] Successfully synchronized OpenRP skills across ${syncedCount} detected platform(s).\n`);
  }
}

async function checkRemoteVersion() {
  return new Promise((resolve) => {
    https.get('https://registry.npmjs.org/openrp-toolkit/latest', { timeout: 3000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.version || null);
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

async function runUpdate() {
  printBanner();
  console.log('◇  Checking for OpenRP Toolkit updates on npm & GitHub...\n');

  const localPkg = JSON.parse(fs.readFileSync(path.join(PACKAGE_ROOT, 'package.json'), 'utf8'));
  const currentVersion = localPkg.version;
  console.log(`   Current Local Version: v${currentVersion}`);

  const remoteVersion = await checkRemoteVersion();
  if (remoteVersion) {
    console.log(`   Latest npm Version:   v${remoteVersion}`);
  } else {
    console.log(`   (Could not reach npm registry, checking local git repository...)`);
  }

  // If in git repo, pull latest git changes
  const gitDir = path.join(PACKAGE_ROOT, '.git');
  if (fs.existsSync(gitDir)) {
    console.log('\n◇  Updating via Git Repository (git pull)...');
    try {
      execSync('git pull origin main', { cwd: PACKAGE_ROOT, stdio: 'inherit' });
      console.log('   ✓ Git repository updated to latest commit.');
    } catch (err) {
      console.log(`   ✗ Git pull skipped: ${err.message}`);
    }
  } else {
    // Global npm update
    console.log('\n◇  Updating via npm (npm install -g openrp-toolkit@latest)...');
    try {
      execSync('npm install -g openrp-toolkit@latest', { stdio: 'inherit' });
      console.log('   ✓ npm package updated to latest release.');
    } catch (err) {
      console.log(`   ✗ npm update failed: ${err.message}`);
    }
  }

  // Auto-sync skills to active platforms
  console.log('\n◇  Synchronizing updated skill files to all detected agent platforms...');
  runSync(false);

  console.log('┌───────────────────────────────────────────────────────────────┐');
  console.log('│ [SUCCESS] OpenRP Toolkit & Skills are up to date!             │');
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
  case 'sync':
    runSync(args.includes('--silent'));
    break;
  case 'update':
  case 'upgrade':
    runUpdate();
    break;
  case 'release':
    require('./release');
    break;
  case 'list':
    runList();
    break;
  case 'auth':
    runAuth();
    break;
  case 'web-login':
    runWebLogin();
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

