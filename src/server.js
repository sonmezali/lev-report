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

const index = fs.readFileSync(path.resolve('pages/index.html'));
server.get('/', (req, res) => {
  res.end(index);
});

server.listen(config.http.port, config.http.host, () => {
  global.logger.info('%s listening at %s', server.name, server.url);
});
