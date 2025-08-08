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
