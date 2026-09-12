module.exports = {
  apps: [{
    name: 'clinicvip',
    script: 'server.js',
    node_args: '--max-old-space-size=256',
    max_memory_restart: '200M',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    env: { NODE_ENV: 'development', PORT: 3000 },
    env_production: { NODE_ENV: 'production', PORT: 3000 },
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss'
  }]
};
