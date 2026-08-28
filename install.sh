#!/bin/bash
# OpenRP Toolkit & Skill Installer / Auto-Updater
# Pure bash & Node.js edition - Installs/Updates skills across all detected AI platforms

set -e

echo "┌───────────────────────────────────────────────────────────────┐"
echo "│ 🚀 OpenRP AI Agent Skill & MCP Suite Auto-Updater             │"
echo "│ Maintainer: Kaa (https://github.com/kaaelix/openrp-toolkit)   │"
echo "└───────────────────────────────────────────────────────────────┘"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js 18+ is required but not found in PATH."
  exit 1
fi

# Execute self-sync directly from npx
echo "◇ Downloading and synchronizing latest OpenRP skills..."
npx --yes openrp-toolkit sync

echo ""
echo "✅ All OpenRP Agent Skills and MCP configurations are up to date!"
