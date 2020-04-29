'use strict';

const Promise = require('bluebird');
const moment = require('moment');
const config = require('../config');
const query = config.postgres.mock ? require('../../mock/mock-query') : require('./db/query');

const objPush = (obj, key, value) => void (obj[key] = value) || obj; // eslint-disable-line no-void

const dayGenerator = function* dayGenerator(from, to) { // eslint-disable-line generator-star-spacing
  while (from.isBefore(to)) {
    yield from.valueOf();
    from.add(1, 'days');
  }
};
const datesInRange = (from, to) => [...dayGenerator(moment(from), to)];

const DATE_FORMAT = 'YYYY-MM-DD';
const insertData = (model, data) => data.forEach(
  d => model[d.dataset] && (model[d.dataset].push({
    date: moment(d.date, DATE_FORMAT).valueOf(),
    usage: d.count
  }))
);

const datatypes = ['birth', 'death', 'marriage', 'partnership'];
const dailyUsage = (dateFrom, dateTo, searchGroup, searchWithoutGroups) => {
  const usage = datatypes.reduce((u, dt) => objPush(u, dt, []), { });

  return query.usageByDateType(dateFrom, dateTo, searchGroup, searchWithoutGroups).then(data => {
    insertData(usage, data);
    return Object.entries(usage).reduce((u, e) => [...u, { name: e[0], dailyUsage: e[1] }], []);
  });
};

const datasetUsage = (dateFrom, dateTo) => query.usageByType(dateFrom, dateTo).then(totals =>
  totals && totals.length && totals.reduce((o, ds) => ({
    ...o,
    [ds.dataset]: ds.count,
    total: o.total + ds.count
  }), { total: 0 }));

const group = (g, parent) => datatypes.reduce((o, d) => ({ ...o, [d]: d === g.dataset ? g.count : 0 }), {
  id: g.name.replace(/^\/Team |^\/\w+ - |[^\w]/g, ''),
  name: g.name,
  total: g.count,
  parent: parent && (parent.hasChildren = true) ? parent.id : null
});
const findParent = (data, groups) => groups.find(g => data.name.search(new RegExp(`\\b${g.id}\\b`)) > -1);
const processGroups = data => data.reduce(
  (groups, d, i, a, len = groups.length, last = len && groups[len - 1]) =>
    len && d.name === last.name
      ? objPush(groups, len - 1, { ...last, [d.dataset]: d.count, total: last.total + d.count })
      : [...groups, group(d, len && findParent(d, groups))]
  , []);
const groupUsage = (dateFrom, dateTo) => query.usageByGroup(dateFrom, dateTo).then(processGroups);

const build = (dateFrom, dateTo, searchGroup, groupSearchText, searchWithoutGroups) => Promise.join(
  dailyUsage(dateFrom, dateTo, searchGroup, searchWithoutGroups),
  datasetUsage(dateFrom, dateTo),
  groupUsage(dateFrom, dateTo),
  query.searchWithGroupFiltering(dateFrom, dateTo, searchGroup, searchWithoutGroups),
  (daily, totals, groups, total) => ({
    from: dateFrom,
    to: dateTo,
    dates: datesInRange(dateFrom, dateTo || moment().endOf('day')),
    datasets: daily,
    groups,
    totals,
    currentGroup: groupSearchText,
    total,
    withoutGroups: searchWithoutGroups
  })
);

module.exports = build;
