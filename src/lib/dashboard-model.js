'use strict';

const config = require('../config');
const query = config.postgres.mock ? require('../../mock/mock-query') : require('./db/query');

const costSaving = () => query.totalCustomerSearches()
  .then(searches => Math.round(((searches / 2) + 793235) * 1.81));

const build = () => Promise.join(
  query.searchTotals(true),
  query.searchTotals(false),
  costSaving(),
  (allTime, todaySearches, customerCostSaving) => ({
    allTime,
    todaySearches,
    customerCostSaving,
  })
);

module.exports = build;
