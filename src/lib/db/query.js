'use strict';

const db = require('./postgres');

const baseQuery = 'SELECT date_time::date as date, dataset, count(*) from lev_audit WHERE date_time > $1';
const grouping = ' group by date_time::date, dataset order by date_time::date';

module.exports = {
  usageSinceDate: (from) => db.manyOrNone(`${baseQuery} ${grouping}`, from)
    .catch(e => {
      global.logger.error(`Problem retrieving usage data since: ${from}`, e);
      throw new Error('Could not fetch data');
    }),

  usageDuringDateRange: (from, to) => db.manyOrNone(`${baseQuery} AND date_time < $2 ${grouping}`, [from, to])
    .catch(e => {
      global.logger.error(`Problem retrieving usage data between: ${from} and ${to}`, e);
      throw new Error('Could not fetch data');
    }),
};
