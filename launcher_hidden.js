#!/usr/bin/env node
const { spawn } = require('child_process');

const rootDir = process.cwd();
const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';
const startUrl = 'http://127.0.0.1:3002';

function openBrowser(url) {
  try {
    if (isWindows) {
      const child = spawn('cmd', ['/c', 'start', '', url], {
        cwd: rootDir,
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      });
      child.unref();
    } else {
      const opener = process.platform === 'darwin' ? 'open' : 'xdg-open';
      const child = spawn(opener, [url], {
        cwd: rootDir,
        detached: true,
        stdio: 'ignore'
      });
      child.unref();
    }
  } catch (error) {
    // Ignore browser launch issues
  }
}

const child = spawn(npmCommand, ['run', 'dev'], {
  cwd: rootDir,
  detached: isWindows,
  stdio: 'ignore',
  windowsHide: true,
  env: { ...process.env, BROWSER: 'none' }
});

if (isWindows) {
  child.unref();
}

setTimeout(() => openBrowser(startUrl), 1800);
