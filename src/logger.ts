import pino from 'pino';
import path from 'path';
import fs from 'fs';
import pinoRotate from 'pino-daily-rotate-file';

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const level = process.env.LOG_LEVEL || 'info';

const transport = pino.transport({
  target: 'pino-daily-rotate-file',
  options: {
    dirname: logDir,
    filename: 'app-%DATE%.log',
    frequency: 'daily',
    level
  }
});

const logger = pino({ level }, transport);

export default logger;
