#!/usr/bin/env node
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const [, , command, repo] = process.argv;

function usage() {
  console.log('Usage: agent add <repo-url>');
  process.exit(1);
}

if (command !== 'add' || !repo) {
  usage();
}

const pluginsDir = path.resolve(__dirname, 'plugins');
if (!fs.existsSync(pluginsDir)) {
  fs.mkdirSync(pluginsDir, { recursive: true });
}

const clone = spawnSync('git', ['clone', repo], { cwd: pluginsDir, stdio: 'inherit' });
if (clone.status !== 0) {
  process.exit(clone.status || 1);
}

// copy frontend part if exists
const repoName = path.basename(repo, '.git').split('/').pop();
const pluginPath = path.join(pluginsDir, repoName);
const pluginSrc = path.join(pluginPath, 'src');
const targetSrc = path.resolve(__dirname, 'src/plugins', repoName);
if (fs.existsSync(pluginSrc)) {
  fs.cpSync(pluginSrc, targetSrc, { recursive: true });
}

// reload ts registry
require('ts-node/register');
const { reloadRegistry } = require('./src/tools/registry');
reloadRegistry();

// reload python registry
spawnSync('python', ['-c', 'from py.tool_registry import reload_plugins; reload_plugins()'], { stdio: 'inherit' });
