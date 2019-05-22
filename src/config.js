'use strict';

/* eslint-disable no-process-env */
module.exports = {
  name: require('../package').name,
  postgres: {
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: process.env.POSTGRES_PORT || '5432',
    database: process.env.POSTGRES_DB || 'lev',
    ssl: process.env.POSTGRES_SSL || false
  },
  http: {
    host: process.env.LISTEN_HOST || '0.0.0.0',
    port: process.env.LISTEN_PORT || 4000
  }
};
/* eslint-enable no-process-env */
