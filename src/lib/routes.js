'use strict';

const dateFormat = 'YYYY-MM-DD HH:mm:ss';
const moment = require('moment');
const model = require('./model');
const dashboardModel = require('./dashboard-model');
const { LevDashboard, LevReport } = require('lev-react-components');

module.exports = server => {
  server.get('/readiness', (req, res) => {
    res.send('OK');
  });

  server.get('/data', (req, res, next) => { // eslint-disable-line consistent-return
    const fromDate = req.query && moment(req.query.from, dateFormat);
    const toDate = req.query && req.query.to && moment(req.query.to, dateFormat);

    if (fromDate && fromDate.isValid()) {
      if (!toDate || toDate.isValid()) {
        const from = fromDate.format(dateFormat);
        const to = toDate && toDate.format(dateFormat);
        return model(from, to)
          .then(data => JSON.stringify(data, null, 2))
          .then(res.end.bind(res))
          .catch(err => {
            server.log.error(err);
            next(new server.errors.InternalServerError(err));
          });
      }
      next(new server.errors.BadRequestError(`Make sure the date format is "${dateFormat}" (time is optional)`));
    } else {
      next(new server.errors.BadRequestError('Must provide a "from" date parameter, and optionally a "to" date'));
    }
  });

  server.get('/dashboard', (req, res) => {
    dashboardModel()
      .then(props => res.render(LevDashboard, props))
      .catch(err => server.log.error(err));
  });

  server.get('/dashboard/data', (req, res, next) => { // eslint-disable-line consistent-return
    return dashboardModel()
      .then(data => JSON.stringify(data, null, 2))
      .then(res.end.bind(res))
      .catch(err => {
        server.log.error(err);
        next(new server.errors.InternalServerError(err));
      });
  });

  server.get('/*', (req, res) => {
    const fromDate = req.query && req.query.from && moment(req.query.from, dateFormat);
    const toDate = req.query && req.query.to && moment(req.query.to, dateFormat);

    model(
      fromDate.isValid() ? fromDate.format(dateFormat) : moment().startOf('month'),
      toDate.isValid() && toDate.format(dateFormat))
      .then(props => res.render(LevReport, props))
      .catch(err => {
        server.log.error(err);
        res.render(LevReport);
      });
  });
};
