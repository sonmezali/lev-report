'use strict';

const dateFormat = 'YYYY-MM-DD HH:mm:ss';
const moment = require('moment');
const query = require('./db/query');
const model = require('./model');

module.exports = server => {
  server.get('/readiness', (req, res) => {
    res.send('OK');
  });

  server.get('/data', (req, res, next) => { // eslint-disable-line consistent-return
    const fromDate = req.query && moment(req.query.fromDate, dateFormat);
    const toDate = req.query && req.query.toDate && moment(req.query.toDate, dateFormat);

    if (fromDate && fromDate.isValid()) {
      if (!toDate || toDate.isValid()) {
        return (toDate ?
          query.usageDuringDateRange(fromDate.format(dateFormat), toDate.format(dateFormat)) :
          query.usageSinceDate(fromDate.format(dateFormat)))
          .then(data => model(fromDate, toDate || moment(), data))
          .then(JSON.stringify)
          .then(res.end.bind(res))
          .catch(err => {
            server.log.error(err);
            next(new server.errors.InternalServerError(err));
          });
      }

      next(new server.errors.BadRequestError(`Make sure the date format is '${dateFormat}' (time is optional)`));
    } else {
      next(new server.errors.BadRequestError('Must provide a \'fromDate\' parameter, and optionally a \'toDate\''));
    }
  });
};
