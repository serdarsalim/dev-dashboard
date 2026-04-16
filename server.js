const express = require('express');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);
const app = express();
const DASHBOARD_PORT = 4000;
const PORTFOLIO_DIR = path.join(__dirname, '..');
const PORTS_FILE = path.join(__dirname, 'ports.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory process store: { appName: { proc, port } }
const running = {};

// --- Ports persistence ---

function loadPorts() {
  try { return JSON.parse(fs.readFileSync(PORTS_FILE, 'utf8')); }
  catch { return {}; }
}

function savePorts(ports) {
  fs.writeFileSync(PORTS_FILE, JSON.stringify(ports, null, 2));
}

function assignPorts(appNames) {
  const ports = loadPorts();
  const used = new Set(Object.values(ports));
  let next = 3001;
  for (const name of appNames) {
    if (!ports[name]) {
      while (used.has(next)) next++;
      ports[name] = next;
      used.add(next);
      next++;
    }
  }
  savePorts(ports);
  return ports;
}

// --- App scanning ---

function scanApps() {
  const entries = fs.readdirSync(PORTFOLIO_DIR, { withFileTypes: true });
  const apps = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const name = entry.name;
    if (name === 'dev-dashboard') continue;

    const pkgPath = path.join(PORTFOLIO_DIR, name, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;

    let pkg;
    try { pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')); }
    catch { continue; }

    if (!pkg.scripts?.dev) continue;
    apps.push(name);
  }

  return apps;
}

// --- Git status ---

async function getGitStatus(appDir) {
  try {
    await execAsync(`git -C "${appDir}" rev-parse --git-dir`);
  } catch {
    return { isRepo: false };
  }

  const status = { isRepo: true, uncommitted: 0, unpushed: 0, hasUpstream: false };

  try {
    const { stdout } = await execAsync(`git -C "${appDir}" status --porcelain`);
    status.uncommitted = stdout.trim().split('\n').filter(Boolean).length;
  } catch {}

  try {
    await execAsync(`git -C "${appDir}" rev-parse @{u}`);
    status.hasUpstream = true;
    const { stdout } = await execAsync(`git -C "${appDir}" log @{u}..HEAD --oneline`);
    status.unpushed = stdout.trim().split('\n').filter(Boolean).length;
  } catch {}

  return status;
}

// --- API ---

app.get('/api/apps', async (req, res) => {
  const appNames = scanApps();
  const ports = assignPorts(appNames);

  const apps = await Promise.all(appNames.map(async name => ({
    name,
    port: ports[name],
    running: !!running[name],
    git: await getGitStatus(path.join(PORTFOLIO_DIR, name))
  })));

  res.json(apps);
});

app.post('/api/apps/:name/start', (req, res) => {
  const { name } = req.params;
  if (running[name]) return res.json({ error: 'Already running' });

  const ports = loadPorts();
  const port = ports[name];
  const appDir = path.join(PORTFOLIO_DIR, name);

  const proc = spawn('npm', ['run', 'dev'], {
    cwd: appDir,
    env: { ...process.env, PORT: port, VITE_PORT: port },
    detached: true,
    stdio: 'ignore'
  });

  proc.on('exit', () => { delete running[name]; });
  running[name] = { proc, port };

  res.json({ started: true, port });
});

app.post('/api/apps/:name/stop', (req, res) => {
  const { name } = req.params;
  if (!running[name]) return res.json({ error: 'Not running' });

  try {
    process.kill(-running[name].proc.pid, 'SIGTERM');
  } catch {
    running[name].proc.kill('SIGTERM');
  }
  delete running[name];

  res.json({ stopped: true });
});

app.put('/api/apps/:name/port', (req, res) => {
  const { name } = req.params;
  const { port } = req.body;
  if (!port || isNaN(port)) return res.status(400).json({ error: 'Invalid port' });

  const ports = loadPorts();
  ports[name] = parseInt(port);
  savePorts(ports);
  res.json({ updated: true });
});

app.post('/api/stop-all', (req, res) => {
  for (const name of Object.keys(running)) {
    try { process.kill(-running[name].proc.pid, 'SIGTERM'); } catch { running[name].proc.kill('SIGTERM'); }
    delete running[name];
  }
  res.json({ stopped: true });
});

app.listen(DASHBOARD_PORT, () => {
  console.log(`\n  dev-dashboard → http://localhost:${DASHBOARD_PORT}\n`);
});
