// PM2 process manager config for Rice Mill Express backend
// Usage on the server:
//   pm2 start ecosystem.config.js
//   pm2 save
//   pm2 startup   (run the command it prints, so it auto-starts on reboot)
module.exports = {
  apps: [
    {
      name: 'ricemill-api',
      script: 'server.js',
      cwd: __dirname,
      instances: 1,          // keep 1 unless you set up Redis for multi-instance socket.io
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      // Logs (view with: pm2 logs ricemill-api)
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
