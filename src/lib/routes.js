'use strict';

const dateFormat = 'YYYY-MM-DD HH:mm:ss';
const moment = require('moment-timezone');
const model = require('./model');
const dashboardModel = require('./dashboard-model');
const { LevDashboard, LevReport } = require('lev-react-components');

const promiseResponder = (promise, req, res, next, component) => promise
  .then(data => component ? res.render(component, data) : res.send(data))
  .catch(err => {
    req.log.error(err);
    return next(err);
  });

const dateChecker = (d, m = moment(d, dateFormat)) => !!d && m.isValid() && m.tz('Europe/London').toISOString();

module.exports = server => {
  server.get('/readiness', (req, res) => res.send('OK'));

  server.get('/data', (req, res, next) => { // eslint-disable-line consistent-return
    const fromDate = dateChecker(req.query.from);
    const toDate = dateChecker(req.query && req.query.to);

    if (dateChecker(fromDate)) {
      if (dateChecker(toDate)) {
        return promiseResponder(model(fromDate, toDate), req, res, next);
      }
      return next(new server.errors.BadRequestError(`Make sure the date format is "${dateFormat}" (time is optional)`));
    }
    return next(new server.errors.BadRequestError('Must provide "from" date parameter, and optionally a "to" date'));
  });

  server.get('/dashboard', (req, res, next) => promiseResponder(dashboardModel(), req, res, next, LevDashboard));

  server.get('/dashboard/data', (req, res, next) => promiseResponder(dashboardModel(), req, res, next));

  server.get('/*', (req, res, next) => {
    const fromDate = dateChecker(req.query && req.query.from);
    const toDate = dateChecker(req.query && req.query.to);
    const searchGroup = req.query && req.query.currentGroup;

    return promiseResponder(model(
      (fromDate ? fromDate : moment().startOf('month').tz('Europe/London').toISOString()),
      toDate,
      searchGroup === 'No group' ? '{}' : searchGroup,
      searchGroup
    ), req, res, next, LevReport);
  });
};
