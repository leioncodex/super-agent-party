import { Tool } from './tool';
import { exec } from 'child_process';

export const shell: Tool = {
  name: 'shell',
  description: 'Execute shell commands',
  schema: {
    type: 'object',
    properties: { cmd: { type: 'string' } },
    required: ['cmd']
  },
  handler: ({ cmd }: { cmd: string }) => new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(stderr || err.message);
      } else {
        resolve(stdout);
      }
    });
  })
};
