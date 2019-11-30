'use strict';

const config = require('../config');
const query = config.postgres.mock ? require('../../mock/mock-query') : require('./db/query');

const build = () => Promise.join(
  query.searchTotals(true),
  query.searchTotals(false),
  (allTime, todaySearches) => ({
    allTime,
    todaySearches,
  })
);

module.exports = build;
