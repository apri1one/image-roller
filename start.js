const { spawn, exec } = require('child_process');
const path = require('path');

const backend = spawn('node', ['src/core/master.js', '--no-ui'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

const frontend = spawn('node', ['serve.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

setTimeout(() => {
  const url = 'http://localhost:8180';
  const cmd = process.platform === 'win32' ? `start "" "${url}"`
    : process.platform === 'darwin' ? `open "${url}"`
    : `xdg-open "${url}"`;
  exec(cmd);
}, 5000);

process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit();
});
