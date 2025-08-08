import { Tool } from './tool';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

const tools = new Map<string, Tool>();

export function registerTool(tool: Tool): void {
  tools.set(tool.name, tool);
}

export function getTool(name: string): Tool | undefined {
  return tools.get(name);
}

export async function loadPlugins(): Promise<void> {
  const pluginsDir = path.resolve(__dirname, '../plugins');
  if (!fs.existsSync(pluginsDir)) {
    return;
  }

  const files = fs.readdirSync(pluginsDir);
  for (const file of files) {
    if (file.endsWith('.ts') || file.endsWith('.js')) {
      const modulePath = path.join(pluginsDir, file);
      await import(pathToFileURL(modulePath).href);
    }
  }
}
import fs from 'fs';
import path from 'path';
import Ajv, { ValidateFunction } from 'ajv';
import { Tool } from './tool';
import { shell } from './shell';
import { webFetch } from './web-fetch';

interface Entry { tool: Tool; validate: ValidateFunction }
const registry = new Map<string, Entry>();
const ajv = new Ajv();

export function registerTool(tool: Tool) {
  const validate = ajv.compile(tool.schema);
  registry.set(tool.name, { tool, validate });
}

export function getTool(name: string): Tool | undefined {
  return registry.get(name)?.tool;
}

export async function callTool(name: string, args: any): Promise<any> {
  const entry = registry.get(name);
  if (!entry) throw new Error(`Tool ${name} not found`);
  if (!entry.validate(args)) {
    throw new Error('Invalid arguments');
  }
  return await entry.tool.handler(args);
}

export function loadPlugins() {
  const pluginsDir = path.resolve(__dirname, '../plugins');
  if (!fs.existsSync(pluginsDir)) return;
  for (const file of fs.readdirSync(pluginsDir)) {
    if (file.endsWith('.js') || file.endsWith('.mjs')) {
      const modulePath = path.join(pluginsDir, file);
      const mod = require(modulePath);
      const plugin: Tool | undefined = mod.default || mod.tool || mod;
      if (plugin) {
        registerTool(plugin);
      }
    }
  }
}

export function reloadRegistry() {
  registry.clear();
  registerBuiltins();
  loadPlugins();
}

function registerBuiltins() {
  registerTool(shell);
  registerTool(webFetch);
}

registerBuiltins();
loadPlugins();
