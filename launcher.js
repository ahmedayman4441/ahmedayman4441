#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const rootDir = process.cwd();
const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';
const startUrl = 'http://127.0.0.1:3002';

function openBrowser(url) {
  try {
    if (isWindows) {
      const child = spawn('cmd', ['/c', 'start', '', url], {
        stdio: 'ignore',
        detached: true
      });
      child.unref();
    } else {
      const opener = process.platform === 'darwin' ? 'open' : 'xdg-open';
      const child = spawn(opener, [url], {
        stdio: 'ignore',
        detached: true
      });
      child.unref();
    }
  } catch (error) {
    console.warn('Could not open browser automatically:', error.message);
  }
}

console.log('Starting Smart Sales App...');
console.log(`Working directory: ${rootDir}`);

const child = spawn(npmCommand, ['run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: { ...process.env, BROWSER: 'none' }
});

child.on('exit', (code) => {
  if (code && code !== 0) {
    process.exit(code);
  }
});

setTimeout(() => openBrowser(startUrl), 1500);
