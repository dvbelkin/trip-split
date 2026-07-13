module.exports = {
  apps: [
    {
      name: "trip-split",
      cwd: "/var/www/trip-split",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3011,
      },
    },
  ],
};
