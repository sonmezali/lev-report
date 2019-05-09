'use strict';

const moment = require('moment');

const objPush = (obj, key, value) => void (obj[key] = value) || obj; // eslint-disable-line no-void

const DATE_FORMAT = 'YYYY-MM-DD';
const dayGenerator = function* dayGenerator(from, to, format) { // eslint-disable-line generator-star-spacing
  yield from.format(format);
  while (from.isBefore(to)) {
    from.add(1, 'days');
    yield from.format(format);
  }
};
const datesInRange = (from, to, format = DATE_FORMAT) => [...dayGenerator(moment(from), to, format)];

const inity = (dateFrom, dateTo) => () => datesInRange(dateFrom, dateTo).reduce((y, d) => objPush(y, d, 0), {});

const initModel = (datatypes, dates, init) => datatypes.reduce((m, t) => objPush(m, t, {
    name: t,
    x: dates,
    y: init(),
    type: 'bar',
    textposition: 'auto',
    hoverinfo: t,
    opacity: 0.5,
    marker: {
      color: 'rgb(158,202,225)',
      line: {
        color: 'rgb(8,48,107)',
        width: 1.5
      }
    }
  }), {});

const insertData = (model, data) => data.forEach(d => model[d.dataset] && (model[d.dataset].y[d.date] = d.count));

/* eslint-disable no-return-assign */
const unobjectifyy = model => Object.values(model).forEach(trace => trace.y = Object.values(trace.y));

const addTraceText = model => Object.values(model).forEach(trace => trace.text = trace.y.map(String));
/* eslint-enable no-return-assign */

module.exports = (dateFrom, dateTo, data) => {
  const datatypes = ['birth', 'death', 'marriage', 'partnership'];

  const model = initModel(datatypes, datesInRange(dateFrom, dateTo, 'D MMM'), inity(dateFrom, dateTo));
  insertData(model, data);
  unobjectifyy(model);
  addTraceText(model);

  return Object.values(model);
};
