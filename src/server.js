'use strict';

global.Promise = require('bluebird');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const restify = require('lev-restify');
const server = restify.createServer(config.name);
server.errors = restify.errors;
global.logger = server.log;
require('./lib/routes')(server);

const bundle = fs.readFileSync(path.resolve('public/js/bundle.js'));
server.get('/public/js/bundle.js', (req, res) => {
  res.end(bundle);
});

const index = fs.readFileSync(path.resolve('pages/index.html'));
server.get('/', (req, res) => {
  res.end(index);
});

server.listen(config.http.port, config.http.host, () => {
  global.logger.info('%s listening at %s', server.name, server.url);
});


// gracefully handle shutdowns -----------------------

const closeGracefully = (signal) => {
  setTimeout(() => {
    global.logger.warn('Forcefully shutting down from sig:', signal);
    process.exit(0); // eslint-disable-line no-process-exit
  }, 500);

  server.close(() => process.exit(0)); // eslint-disable-line no-process-exit
};

['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal =>
  process.on(signal, () => closeGracefully(signal))
);
