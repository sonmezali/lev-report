
module.exports = {
  usageByDateType: {
    fromDateOnlySQL: `SELECT date_time::DATE AS date, dataset, count(*)::INTEGER
FROM lev_audit
WHERE date_time >= ($(from)::timestamp without time zone) at time zone 'Europe/London'
GROUP BY date, dataset
ORDER BY date`,
    allParametersSQL: `SELECT date_time::DATE AS date, dataset, count(*)::INTEGER
FROM lev_audit
WHERE date_time >= ($(from)::timestamp without time zone) at time zone 'Europe/London' AND date_time < ($(to)::timestamp without time zone) at time zone 'Europe/London' AND groups::TEXT ILIKE '%' || $(group) || '%'
GROUP BY date, dataset
ORDER BY date`
  },

  usageByType: {
    fromDateSQL: `SELECT dataset, count(*)::INTEGER
FROM lev_audit
WHERE date_time >= ($(from)::timestamp without time zone) at time zone 'Europe/London'
GROUP BY dataset`,
    fromToSQL: `SELECT dataset, count(*)::INTEGER
FROM lev_audit
WHERE date_time >= ($(from)::timestamp without time zone) at time zone 'Europe/London' AND date_time < ($(to)::timestamp without time zone) at time zone 'Europe/London'
GROUP BY dataset`
  },

  usageByGroup: {
    fromDateSQL: `
SELECT name, dataset, SUM(count)::INTEGER AS count
FROM (
  SELECT UNNEST(groups) AS name, dataset, COUNT(*)
    FROM lev_audit
    WHERE date_time >= ($(from)::timestamp without time zone) at time zone 'Europe/London'
    GROUP BY name, dataset 
  UNION
  SELECT 'No group' AS name, dataset, COUNT(*)
    FROM lev_audit
    WHERE groups='{}' AND date_time >= ($(from)::timestamp without time zone) at time zone 'Europe/London'
    GROUP BY name, dataset
) AS counts
GROUP BY name, dataset
ORDER BY name~'^/Team' desc, name`,
    fromToSQL: `
SELECT name, dataset, SUM(count)::INTEGER AS count
FROM (
  SELECT UNNEST(groups) AS name, dataset, COUNT(*)
    FROM lev_audit
    WHERE date_time >= ($(from)::timestamp without time zone) at time zone 'Europe/London'
      AND date_time < ($(to)::timestamp without time zone) at time zone 'Europe/London'
    GROUP BY name, dataset 
  UNION
  SELECT 'No group' AS name, dataset, COUNT(*)
    FROM lev_audit
    WHERE groups='{}' AND date_time >= ($(from)::timestamp without time zone) at time zone 'Europe/London'
      AND date_time < ($(to)::timestamp without time zone) at time zone 'Europe/London'
    GROUP BY name, dataset
) AS counts
GROUP BY name, dataset
ORDER BY name~'^/Team' desc, name`
  },

  usageByUser: {
    fromDateSQL: `SELECT date_time::DATE AS date, dataset, username, count(*)::INTEGER
FROM lev_audit
WHERE date_time >= ($(from)::timestamp without time zone) at time zone 'Europe/London'
GROUP BY date, dataset, username
ORDER BY date`,
    fromToSQL: `SELECT date_time::DATE AS date, dataset, username, count(*)::INTEGER
FROM lev_audit
WHERE date_time >= ($(from)::timestamp without time zone) at time zone 'Europe/London' AND date_time < ($(to)::timestamp without time zone) at time zone 'Europe/London'
GROUP BY date, dataset, username
ORDER BY date`
  },

  searchTotals: {
    totalCountSQL: `SELECT count(*)::INTEGER FROM lev_audit`,
    todayCountSQL: `SELECT count(*)::INTEGER FROM lev_audit WHERE date_time >= (current_date::date)::timestamp`
  },

  searchTimePeriodByGroup: {
    fromToGroupSQL: `SELECT count(*)::INTEGER
FROM lev_audit
WHERE date_time >= ($(from)::timestamp without time zone) at time zone 'Europe/London' AND date_time < ($(to)::timestamp without time zone) at time zone 'Europe/London' AND groups::TEXT ILIKE '%' || $(group) || '%'`,
    gorupOnlySQL: `SELECT count(*)::INTEGER
FROM lev_audit
WHERE groups::TEXT ILIKE '%' || $(group) || '%'`
  }
};