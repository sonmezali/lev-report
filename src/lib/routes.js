'use strict';

const dateFormat = 'YYYY-MM-DD HH:mm:ss';
const moment = require('moment');
const model = require('./model');
const dashboardModel = require('./dashboard-model');
const { LevDashboard, LevReport } = require('lev-react-components');

const promiseResponder = (promise, req, res, next, component) => promise
  .then(data => component ? res.render(component, data) : res.send(data))
  .catch(err => {
    req.log.error(err);
    return next(err);
  });

module.exports = server => {
  server.get('/readiness', (req, res) => res.send('OK'));

  server.get('/data', (req, res, next) => { // eslint-disable-line consistent-return
    const fromDate = req.query && moment(req.query.from, dateFormat);
    const toDate = req.query && req.query.to && moment(req.query.to, dateFormat);

    if (fromDate && fromDate.isValid()) {
      if (!toDate || toDate.isValid()) {
        const from = fromDate.format(dateFormat);
        const to = toDate && toDate.format(dateFormat);
        return promiseResponder(model(from, to), req, res, next);
      }
      return next(new server.errors.BadRequestError(`Make sure the date format is "${dateFormat}" (time is optional)`));
    }
    return next(new server.errors.BadRequestError('Must provide "from" date parameter, and optionally a "to" date'));
  });

  server.get('/dashboard', (req, res, next) => promiseResponder(dashboardModel(), req, res, next, LevDashboard));

  server.get('/dashboard/data', (req, res, next) => promiseResponder(dashboardModel(), req, res, next));

  // eslint-disable-next-line complexity
  server.get('/*', (req, res, next) => {
    const fromDate = req.query && req.query.from && moment(req.query.from, dateFormat);
    const toDate = req.query && req.query.to && moment(req.query.to, dateFormat);
    const searchGroup = req.query && req.query.currentGroup;

    return promiseResponder(model(
      (fromDate && fromDate.isValid() ? fromDate : moment().startOf('month')).format(dateFormat),
      toDate && toDate.isValid() && toDate.format(dateFormat),
      searchGroup === 'No group' ? '{}' : searchGroup,
      searchGroup
    ), req, res, next, LevReport);
  });
};
