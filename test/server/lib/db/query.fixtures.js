
module.exports = {
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