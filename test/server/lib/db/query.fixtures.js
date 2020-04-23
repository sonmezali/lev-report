
module.exports = {
  usageByDateType: {
    fromDateOnlySQL: `SELECT date_time::DATE AS date, dataset, count(*)::INTEGER FROM lev_audit WHERE date_time::DATE >= $(from) GROUP BY date_time::date, dataset ORDER BY date_time::date`,
    allParametersSQL: `SELECT date_time::DATE AS date, dataset, count(*)::INTEGER FROM lev_audit WHERE date_time::DATE >= $(from) AND date_time::DATE < $(to) AND groups::TEXT ILIKE '%' || $(group) || '%' GROUP BY date_time::date, dataset ORDER BY date_time::date`
  },

  usageByType: {
    fromDateSQL: `SELECT dataset, count(*)::INTEGER FROM lev_audit WHERE date_time > $(from)   GROUP BY dataset`,
    fromToSQL: `SELECT dataset, count(*)::INTEGER FROM lev_audit WHERE date_time > $(from) AND date_time < $(to)  GROUP BY dataset`
  },

  usageByGroup: {
    fromDateSQL: `
SELECT name, dataset, SUM(count)::INTEGER AS count
FROM (
  SELECT UNNEST(groups) AS name, dataset, COUNT(*)
    FROM lev_audit
    WHERE date_time > $(from) 
    GROUP BY name, dataset 
  UNION
  SELECT 'No group' AS name, dataset, COUNT(*)
    FROM lev_audit
    WHERE groups='{}' AND date_time > $(from) 
    GROUP BY name, dataset
) AS counts
GROUP BY name, dataset
ORDER BY name~'^/Team' desc, name`,
    fromToSQL: `
SELECT name, dataset, SUM(count)::INTEGER AS count
FROM (
  SELECT UNNEST(groups) AS name, dataset, COUNT(*)
    FROM lev_audit
    WHERE date_time > $(from) AND date_time < $(to)
    GROUP BY name, dataset 
  UNION
  SELECT 'No group' AS name, dataset, COUNT(*)
    FROM lev_audit
    WHERE groups='{}' AND date_time > $(from) AND date_time < $(to)
    GROUP BY name, dataset
) AS counts
GROUP BY name, dataset
ORDER BY name~'^/Team' desc, name`
  },

  usageByUser: {
    fromDateSQL: `SELECT date_time::DATE AS date, dataset, username, count(*)::INTEGER FROM lev_audit WHERE date_time > $(from)   GROUP BY date_time::date, dataset, username ORDER BY date_time::date`,
    fromToSQL: `SELECT date_time::DATE AS date, dataset, username, count(*)::INTEGER FROM lev_audit WHERE date_time > $(from) AND date_time < $(to)  GROUP BY date_time::date, dataset, username ORDER BY date_time::date`
  },

  searchTotals: {
    totalCountSQL: `SELECT count(*)::INTEGER FROM lev_audit`,
    todayCountSQL: `SELECT count(*)::INTEGER FROM lev_audit WHERE date_time::DATE = current_date`
  },

  searchTimePeriodByGroup: {
    fromToGroupSQL: `SELECT count(*)::INTEGER
FROM lev_audit
WHERE date_time::DATE >= $(from) AND date_time::DATE < $(to) AND groups::TEXT ILIKE '%' || $(group) || '%'`,
    gorupOnlySQL: `SELECT count(*)::INTEGER
FROM lev_audit
WHERE groups::TEXT ILIKE '%' || $(group) || '%'`
  }
};