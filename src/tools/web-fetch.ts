import { Tool } from './tool';
import { registerTool } from './registry';

export const webFetch: Tool = {
  name: 'web-fetch',
  description: 'Fetch content from a URL',
  schema: { type: 'string', description: 'URL to fetch' },
  handler: async (url: string) => {
    const res = await fetch(url);
    return await res.text();
  }
};

registerTool(webFetch);
