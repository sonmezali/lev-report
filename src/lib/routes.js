'use strict';

const { promiseResponder, dashboard, home } = require('./route-helpers');
const { LevDashboard, LevReport } = require('lev-react-components');

module.exports = server => {
  server.get('/readiness', (req, res) => res.send('OK'));

  server.get('/data', (req, res, next) =>
    promiseResponder(home(req.query, server.errors.BadRequestError), req, res, next));

  server.get('/dashboard', (req, res, next) => promiseResponder(dashboard(), req, res, next, LevDashboard));

  server.get('/dashboard/data', (req, res, next) => promiseResponder(dashboard(), req, res, next));

  server.get('/*', (req, res, next) => promiseResponder(home(req.query), req, res, next, LevReport));
};
