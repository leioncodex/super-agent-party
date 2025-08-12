#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0];
const repo = args[1];
const update = args.includes('--update') || args.includes('-u');

function usage() {
  console.log('Usage: agent add <repo-url> [--update]');
  process.exit(1);
}

if (command !== 'add' || !repo) {
  usage();
}

const pluginsDir = path.resolve(__dirname, 'plugins');
if (!fs.existsSync(pluginsDir)) {
  fs.mkdirSync(pluginsDir, { recursive: true });
}

const repoName = path.basename(repo, '.git').split('/').pop();
const pluginPath = path.join(pluginsDir, repoName);

if (fs.existsSync(pluginPath)) {
  if (update) {
    console.log(`Updating existing plugin ${repoName}...`);
    const pull = spawnSync('git', ['pull'], { cwd: pluginPath, stdio: 'inherit' });
    if (pull.status !== 0) {
      console.error(`Failed to update plugin ${repoName}.`);
      process.exit(pull.status || 1);
    }
  } else {
    console.log(`Plugin ${repoName} already exists. Use --update to pull latest changes.`);
    process.exit(0);
  }
} else {
  const clone = spawnSync('git', ['clone', repo], { cwd: pluginsDir, stdio: 'inherit' });
  if (clone.status !== 0) {
    console.error(`Failed to clone repository ${repo}.`);
    process.exit(clone.status || 1);
  }
}

// copy frontend part if exists
const pluginSrc = path.join(pluginPath, 'src');
const targetSrc = path.resolve(__dirname, 'src/plugins', repoName);
if (fs.existsSync(pluginSrc)) {
  try {
    fs.cpSync(pluginSrc, targetSrc, { recursive: true });
  } catch (err) {
    console.error(`Failed to copy frontend files for ${repoName}:`, err.message);
  }
}

// reload ts registry
require('ts-node/register');
const { reloadRegistry } = require('./src/tools/registry');
reloadRegistry();

// reload python registry
spawnSync('python', ['-c', 'from py.tool_registry import reload_plugins; reload_plugins()'], { stdio: 'inherit' });
const pyReload = spawnSync('python', ['-c', 'from py.agent_tool import reload_registry; reload_registry()'], { stdio: 'inherit' });
if (pyReload.status !== 0) {
  console.error('Failed to reload python registry.');
  process.exit(pyReload.status || 1);
}
