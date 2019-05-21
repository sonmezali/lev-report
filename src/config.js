'use strict';

/* eslint-disable no-process-env */
module.exports = {
  name: require('../package').name,
  postgres: {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '5432',
    database: process.env.DB_DB || 'lev',
    ssl: process.env.DB_SSL || false
  },
  http: {
    host: process.env.LISTEN_HOST || '0.0.0.0',
    port: process.env.LISTEN_PORT || 4000
  }
};
/* eslint-enable no-process-env */
