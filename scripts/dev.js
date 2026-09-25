// Runs the API (:5000) and the Vite dev server (:3000) together.
const { spawn } = require('child_process');
const path = require('path');

const root = path.join(__dirname, '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const procs = [
    spawn(npm, ['--prefix', 'backend', 'run', 'dev'], { cwd: root, stdio: 'inherit' }),
    spawn(npm, ['--prefix', 'frontend', 'run', 'dev'], { cwd: root, stdio: 'inherit' })
];

const stop = () => procs.forEach((p) => p.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
procs.forEach((p) => p.on('exit', (code) => { if (code) { stop(); process.exit(code); } }));
