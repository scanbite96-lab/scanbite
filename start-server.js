const { spawn } = require("child_process");
const path = require("path");

function startServer() {
  console.log(`[ScanBite Supervisor] Starting Next.js dev server on http://0.0.0.0:3000 at ${new Date().toISOString()}`);
  
  const child = spawn(
    process.execPath,
    [path.join(__dirname, "node_modules", "next", "dist", "bin", "next"), "dev", "-H", "0.0.0.0", "-p", "3000"],
    {
      stdio: ["ignore", "inherit", "inherit"],
      cwd: __dirname,
      env: { ...process.env, PORT: "3000", HOSTNAME: "0.0.0.0" },
    }
  );

  child.on("exit", (code, signal) => {
    console.log(`[ScanBite Supervisor] Next.js exited (code: ${code}, signal: ${signal}). Auto-recovering in 1s...`);
    setTimeout(startServer, 1000);
  });

  child.on("error", (err) => {
    console.error("[ScanBite Supervisor] Child process error:", err);
    setTimeout(startServer, 1000);
  });
}

// Keep process alive indefinitely
setInterval(() => {}, 60000);

startServer();
