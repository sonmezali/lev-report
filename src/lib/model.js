'use strict';

const moment = require('moment');

const objPush = (obj, key, value) => void (obj[key] = value) || obj; // eslint-disable-line no-void

const DATE_FORMAT = 'YYYY-MM-DD';
const dayGenerator = function* dayGenerator(from, to, format) { // eslint-disable-line generator-star-spacing
  while (from.isBefore(to)) {
    yield from.valueOf();
    from.add(1, 'days');
  }
};
const datesInRange = (from, to, format = DATE_FORMAT) => [...dayGenerator(moment(from), to, format)];

const insertData = (model, data) => data.forEach(
  d => model[d.dataset] && (model[d.dataset].push({
    date: moment(d.date, DATE_FORMAT).valueOf(),
    usage: parseInt(d.count, 10)
  }))
);

module.exports = (dateFrom, dateTo, data) => {
  const datatypes = ['birth', 'death', 'marriage', 'partnership'];

  const model = datatypes.reduce((m, dt) => objPush(m, dt, []), {
    dates: datesInRange(dateFrom, dateTo)
  });
  insertData(model, data);

  return model;
};
