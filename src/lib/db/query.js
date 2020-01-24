'use strict';

const db = require('./postgres');

const countsByType = 'SELECT dataset, count(*)::INTEGER FROM lev_audit WHERE date_time > $(from)';
const countsByUser =
  'SELECT date_time::DATE AS date, dataset, username, count(*)::INTEGER FROM lev_audit WHERE date_time > $(from)';
const until = 'AND date_time < $(to)';
const groupByType = ' GROUP BY dataset';
const groupByDateTypeUser = ' GROUP BY date_time::date, dataset, username ORDER BY date_time::date';
const groupByTypeGroup = 'GROUP BY name, dataset';
const totalCount = 'SELECT count(*)::INTEGER FROM lev_audit';
const forToday = ' WHERE date_time::DATE = current_date';
const fromDate = 'date_time::DATE >= $(from)';
const toDate = 'date_time::DATE < $(to)';
const searchGroup = 'groups::TEXT ILIKE \'%\' || $(group) || \'%\'';

const buildCountsByGroup = (from, to, includeNoGroup = true) => `
SELECT name, dataset, SUM(count)::INTEGER AS count
FROM (
  SELECT UNNEST(groups) AS name, dataset, COUNT(*)
    FROM lev_audit
    WHERE date_time > $(from) ${to ? until : ''}
    ${groupByTypeGroup} ${includeNoGroup ? `
  UNION
  SELECT 'No group' AS name, dataset, COUNT(*)
    FROM lev_audit
    WHERE groups='{}' AND date_time > $(from) ${to ? until : ''}` : ''}
    ${groupByTypeGroup}
) AS counts
${groupByTypeGroup}
ORDER BY name~'^/Team' desc, name`;

const filterObject = (obj) => Object.fromEntries(Object.entries(obj).filter(e => e[1]));

const sqlBuilder = (obj) => {
  obj = filterObject(obj);
    return Object.entries(obj).map(([key, value]) =>
      `${key} ${Array.isArray(value) ? value.filter(e => e).join(' AND ') : value}`
    ).join(' ');
};

module.exports = {
  usageByDateType: (from, to, group) => db.manyOrNone(
    sqlBuilder({
      'SELECT': 'date_time::DATE AS date, dataset, count(*)::INTEGER',
      'FROM': 'lev_audit',
      'WHERE': [from && fromDate, to && toDate, group && searchGroup],
      'GROUP BY': 'date_time::date, dataset ORDER BY date_time::date'
    }),
    filterObject({ from: from, to: to, group: group }))
    .catch(e => {
      global.logger.error(`Problem retrieving counts for datatypes by day between: 
      ${from} and ${to || 'now'} 'for' ${group || 'all groups'}`, e);
      throw new Error('Could not fetch data');
    }),

  usageByType: (from, to) => db.manyOrNone(
    `${countsByType} ${to ? until : ''} ${groupByType}`,
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
    `${countsByUser} ${to ? until : ''} ${groupByDateTypeUser}`,
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
      }),
      filterObject({ from, to, group }),
      data => data.count
    )
    .catch(e => {
      global.logger.error(`Problem retrieving a search from "${from}" to "${to}" for group "${group}"`, e);
      throw new Error('Could not fetch data');
    })
};
