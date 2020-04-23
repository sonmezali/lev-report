'use strict';

const dateFormat = 'YYYY-MM-DD';
const moment = require('moment-timezone');
const model = require('./model');
const dashboardModel = require('./dashboard-model');

const promiseResponder = (promise, req, res, next, component) => promise
  .then(data => component ? res.render(component, data) : res.send(data))
  .catch(err => {
    req.log.error(err);
    return next(err);
  });

const dateChecker = (d) => !!d && moment.tz(d, dateFormat, true, 'Europe/London').toISOString();

const home = (query, ErrorReporter) => {
  const fromDate = dateChecker(query && query.from);
  if (ErrorReporter && fromDate === null) {
    throw new ErrorReporter('Must provide "from" date parameter, and optionally a "to" date');
  }
  const toDate = dateChecker(query && query.to);
  if (ErrorReporter && toDate === null) {
    throw new ErrorReporter(`Make sure the date format is "${dateFormat}" (time is ignored)`);
  }
  const searchGroup = query && query.currentGroup;

  return model(
    (fromDate ? fromDate : moment.tz('Europe/London').startOf('month').toISOString()),
    toDate,
    searchGroup === 'No group' ? '{}' : searchGroup,
    searchGroup
  );
};

module.exports = {
  promiseResponder,
  dashboard: dashboardModel,
  home
};
