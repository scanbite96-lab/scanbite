const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const cloudflaredPath = path.join(__dirname, 'cloudflared.exe');
const urlFile = path.join(__dirname, 'public-url.txt');

console.log('[TUNNEL-SUPERVISOR] Starting Cloudflare Tunnel supervisor...');

function startTunnel() {
  console.log('[TUNNEL-SUPERVISOR] Launching cloudflared...');
  const proc = spawn(cloudflaredPath, ['tunnel', '--url', 'http://127.0.0.1:3000', '--protocol', 'http2'], {
    cwd: __dirname,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  proc.stdout.on('data', handleOutput);
  proc.stderr.on('data', handleOutput);

  proc.on('close', (code) => {
    console.log(`[TUNNEL-SUPERVISOR] cloudflared exited with code ${code}. Restarting in 5s...`);
    setTimeout(startTunnel, 5000);
  });

  proc.on('error', (err) => {
    console.error(`[TUNNEL-SUPERVISOR] Spawn error:`, err);
    setTimeout(startTunnel, 5000);
  });
}

function handleOutput(data) {
  const str = data.toString();
  // Look for trycloudflare.com URL
  const match = str.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match) {
    const url = match[0];
    console.log(`\n========================================`);
    console.log(`[TUNNEL-SUPERVISOR] LIVE PUBLIC URL: ${url}`);
    console.log(`========================================\n`);
    fs.writeFileSync(urlFile, url, 'utf8');
  }
  // Optional log
  if (str.includes('Registered tunnel connection') || str.includes('ERR')) {
    process.stdout.write(str);
  }
}

startTunnel();
