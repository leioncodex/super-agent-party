import { Tool } from './tool';
import { exec } from 'child_process';

export const shell: Tool = {
  name: 'shell',
  description: 'Execute shell commands',
  handler: (cmd: string) => new Promise((resolve, reject) => {
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        reject(stderr || err.message);
      } else {
        resolve(stdout);
      }
    });
  })
};
