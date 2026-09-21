module.exports = {
  apps: [
    {
      name: "nexium-backend",
      cwd: "./backend",
      script: "../.venv/Scripts/python.exe",
      args: "-m uvicorn main:app --host 0.0.0.0 --port 8001",
      restart_delay: 3000,
      autorestart: true,
      max_memory_restart: "1G",
      env: {
        PYTHONUNBUFFERED: "1",
        PORT: 8001
      }
    },
    {
      name: "nexium-frontend",
      cwd: "./frontend",
      script: "npm",
      args: "start",
      restart_delay: 3000,
      autorestart: true,
      env: {
        PORT: 3000,
        BROWSER: "none"
      }
    }
  ]
};
