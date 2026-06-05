import { execFileSync } from 'child_process';

const port = Number(process.argv[2] || process.env.PORT || 5000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error(`[predev] Invalid port: ${process.argv[2]}`);
  process.exit(1);
}

const killWindowsPort = () => {
  const output = execFileSync('netstat', ['-ano', '-p', 'tcp'], { encoding: 'utf8' });
  const pids = new Set();

  for (const line of output.split(/\r?\n/)) {
    const parts = line.trim().split(/\s+/);
    const localAddress = parts[1] || '';
    const state = parts[3] || '';
    const pid = parts[4] || '';

    if (state === 'LISTENING' && localAddress.endsWith(`:${port}`) && /^\d+$/.test(pid)) {
      pids.add(pid);
    }
  }

  for (const pid of pids) {
    execFileSync('taskkill', ['/PID', pid, '/F'], { stdio: 'ignore' });
    console.log(`[predev] Freed port ${port} by stopping PID ${pid}`);
  }

  if (pids.size === 0) {
    console.log(`[predev] Port ${port} is free`);
  }
};

const killUnixPort = () => {
  const output = execFileSync('lsof', ['-ti', `tcp:${port}`], { encoding: 'utf8' });
  const pids = output.split(/\s+/).filter(Boolean);

  for (const pid of pids) {
    execFileSync('kill', ['-9', pid], { stdio: 'ignore' });
    console.log(`[predev] Freed port ${port} by stopping PID ${pid}`);
  }

  if (pids.length === 0) {
    console.log(`[predev] Port ${port} is free`);
  }
};

try {
  if (process.platform === 'win32') {
    killWindowsPort();
  } else {
    killUnixPort();
  }
} catch (error) {
  if (error.status === 1) {
    console.log(`[predev] Port ${port} is free`);
  } else {
    console.warn(`[predev] Could not auto-free port ${port}: ${error.message}`);
  }
}
