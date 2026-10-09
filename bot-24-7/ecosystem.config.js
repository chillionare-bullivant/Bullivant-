module.exports = {
  apps: [
    {
      name: "structures-24-7",
      script: "./src/index.js",
      instances: 2, // Cluster mode: if one worker encounters an unhandled exception or OOM, the other continues processing without missing blocks
      exec_mode: "cluster",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      exp_backoff_restart_delay: 100, // Progressive backoff on crash loops
      env: {
        NODE_ENV: "production",
      },
      env_development: {
        NODE_ENV: "development",
      },
    },
  ],
};
