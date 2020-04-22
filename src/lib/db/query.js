'use strict';

const db = require('./postgres');

const groupByTypeGroup = 'GROUP BY name, dataset';
const totalCount = 'SELECT count(*)::INTEGER FROM lev_audit';
const forToday = ' WHERE date_time >= (current_date::date)::timestamp';
const fromDate = 'date_time >= ($(from)::timestamp without time zone) at time zone \'Europe/London\'';
const toDate = 'date_time < ($(to)::timestamp without time zone) at time zone \'Europe/London\'';
const searchGroup = 'groups::TEXT ILIKE \'%\' || $(group) || \'%\'';

const buildCountsByGroup = (from, to, includeNoGroup = true) => `
SELECT name, dataset, SUM(count)::INTEGER AS count
FROM (
  SELECT UNNEST(groups) AS name, dataset, COUNT(*)
    FROM lev_audit
    WHERE ${fromDate}${to ? '\n      AND ' + toDate : ''}
    ${groupByTypeGroup} ${includeNoGroup ? `
  UNION
  SELECT 'No group' AS name, dataset, COUNT(*)
    FROM lev_audit
    WHERE groups='{}' AND ${fromDate}${to ? '\n      AND ' + toDate : ''}` : ''}
    ${groupByTypeGroup}
) AS counts
${groupByTypeGroup}
ORDER BY name~'^/Team' desc, name`;

const filterObject = (obj) => Object.fromEntries(Object.entries(obj).filter(e => e[1]));

const sqlBuilder = (obj, joiner) => {
  obj = filterObject(obj);
    return Object.entries(obj).map(([key, value]) =>
      `${key} ${Array.isArray(value) ? value.filter(e => e).join(' AND ') : value}`
    ).join(joiner || ' ');
};

module.exports = {
  usageByDateType: (from, to, group) => db.manyOrNone(
    sqlBuilder({
      'SELECT': 'date_time::DATE AS date, dataset, count(*)::INTEGER',
      'FROM': 'lev_audit',
      'WHERE': [from && fromDate, to && toDate, group && searchGroup],
      'GROUP BY': 'date, dataset',
      'ORDER BY': 'date'
    }, '\n'),
    filterObject({ from: from, to: to, group: group }))
    .catch(e => {
      global.logger.error(`Problem retrieving counts for datatypes by day between: 
      ${from} and ${to || 'now'} 'for' ${group || 'all groups'}`, e);
      throw new Error('Could not fetch data');
    }),

  usageByType: (from, to) => db.manyOrNone(
    sqlBuilder({
      'SELECT': 'dataset, count(*)::INTEGER',
      'FROM': 'lev_audit',
      'WHERE': [from && fromDate, to && toDate],
      'GROUP BY': 'dataset'
    }, '\n'),
    filterObject({ from: from, to: to }))
    .catch(e => {
      global.logger.error(`Problem retrieving counts for datatypes between: ${from} and ${to || 'now'}`, e);
      throw new Error('Could not fetch data');
    }),

  usageByGroup: (from, to) => db.manyOrNone(buildCountsByGroup(from, to),
    filterObject({ from: from, to: to }))
    .catch(e => {
      global.logger.error(`Problem retrieving counts for groups between: ${from} and ${to || 'now'}`, e);
      throw new Error('Could not fetch data');
    }),

  usageByUser: (from, to) => db.manyOrNone(
    sqlBuilder({
      'SELECT': 'date_time::DATE AS date, dataset, username, count(*)::INTEGER',
      'FROM': 'lev_audit',
      'WHERE': [from && fromDate, to && toDate],
      'GROUP BY': 'date, dataset, username',
      'ORDER BY': 'date'
    }, '\n'),
    filterObject({ from: from, to: to }))
    .catch(e => {
      global.logger.error(`Problem retrieving counts for users between: ${from} and ${to || 'now'}`, e);
      throw new Error('Could not fetch data');
    }),

  searchTotals: (isAllTimeCount) =>
      db.one(`${isAllTimeCount ? totalCount : totalCount + forToday}`, [], data => data.count)
      .catch(e => {
        global.logger.error(`Problem retrieving ${isAllTimeCount ? 'an all time count' : 'a count for today'}`, e);
        throw new Error('Could not fetch data');
      }),

  searchTimePeriodByGroup: (from, to, group) => db.one(
      sqlBuilder({
        'SELECT': 'count(*)::INTEGER',
        'FROM': 'lev_audit',
        'WHERE': [from && fromDate, to && toDate, group && searchGroup]
      }, '\n'),
      filterObject({ from, to, group }),
      data => data.count
    )
    .catch(e => {
      global.logger.error(`Problem retrieving a search from "${from}" to "${to}" for group "${group}"`, e);
      throw new Error('Could not fetch data');
    })
};
