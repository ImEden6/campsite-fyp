module.exports = {
  apps: [
    {
      name: 'campsite-backend',
      script: './backend/dist/index.js',
      cwd: './',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      watch: false,
      ignore_watch: ['node_modules', 'logs'],
      max_memory_restart: '1G',
      
      // Auto restart
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
    },
    {
      name: 'campsite-scheduler',
      script: './backend/dist/scheduler.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      // Logging
      log_file: './logs/scheduler-combined.log',
      out_file: './logs/scheduler-out.log',
      error_file: './logs/scheduler-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Process management
      watch: false,
      max_memory_restart: '256M',
      
      // Auto restart
      autorestart: true,
      max_restarts: 5,
      min_uptime: '10s',
    }
  ],

  deploy: {
    production: {
      user: 'deploy',
      host: ['server1.example.com', 'server2.example.com'],
      ref: 'origin/main',
      repo: 'git@github.com:username/campsite-management-system.git',
      path: '/var/www/campsite-management-system',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'git clone git@github.com:username/campsite-management-system.git /var/www/campsite-management-system',
      'post-setup': 'npm install && npm run build && pm2 start ecosystem.config.js --env production',
      env: {
        NODE_ENV: 'production'
      }
    },
    
    staging: {
      user: 'deploy',
      host: 'staging.example.com',
      ref: 'origin/develop',
      repo: 'git@github.com:username/campsite-management-system.git',
      path: '/var/www/campsite-management-system-staging',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': 'git clone git@github.com:username/campsite-management-system.git /var/www/campsite-management-system-staging',
      'post-setup': 'npm install && npm run build && pm2 start ecosystem.config.js --env staging',
      env: {
        NODE_ENV: 'staging'
      }
    }
  }
};
