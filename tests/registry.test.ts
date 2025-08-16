import fs from 'fs';
import path from 'path';
import { registerTool, getTool, callTool, reloadRegistry } from '../src/tools/registry';
import { Tool } from '../src/tools/tool';

test('register and call tool', async () => {
  const tool: Tool = {
    name: 'echo',
    description: 'echo back',
    schema: { type: 'object', properties: { msg: { type: 'string' } }, required: ['msg'] },
    handler: ({ msg }: any) => msg
  };
  registerTool(tool);
  expect(getTool('echo')).toBeDefined();
  await expect(callTool('echo', { msg: 'hello' })).resolves.toBe('hello');
});

test('load plugin tools', async () => {
  const dir = path.resolve(__dirname, '../src/plugins');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const js = path.join(dir, 'plugin.js');
  fs.writeFileSync(
    js,
    "module.exports={name:'plug',description:'p',schema:{type:'object',properties:{}},handler:()=> 'ok'};"
  );
  await reloadRegistry();
  expect(getTool('plug')).toBeDefined();
  fs.unlinkSync(js);
});
