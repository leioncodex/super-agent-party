import { Tool } from './tool';

export const webFetch: Tool = {
  name: 'web-fetch',
  description: 'Fetch content from a URL',
  handler: async (url: string) => {
    const res = await fetch(url);
    return await res.text();
  }
};
