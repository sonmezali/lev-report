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
    host: process.env.HTTP_HOST || 'localhost',
    port: process.env.HTTP_PORT || 4000
  }
};
/* eslint-enable no-process-env */
