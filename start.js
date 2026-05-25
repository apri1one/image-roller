const { spawn } = require('child_process');
const path = require('path');

const isWin = process.platform === 'win32';
const npm = isWin ? 'npm.cmd' : 'npm';

const backend = spawn(npm, ['start'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit'
});

const frontend = spawn('node', ['serve.js'], {
  cwd: __dirname,
  stdio: 'inherit'
});

process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit();
});
