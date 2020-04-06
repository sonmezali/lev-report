'use strict';

const config = require('../config');
const query = config.postgres.mock ? require('../../mock/mock-query') : require('./db/query');

// Martin's Multiplier, an estimated ratio of relevant searches in the audit table, currently 55%
const RELEVANT_SEARCH_RATIO = 0.55;
// Cost of a Second Class "Signed for" letter from Royal Mail: £1.81
const POSTAGE = 1.81;
const POSTAGE_RATIO = RELEVANT_SEARCH_RATIO * POSTAGE;
// costSaving takes TotalSearches and calculates the approximate cost saving to the public
// ...from not having to send certificates by post
const costSaving = TotalSearches => Math.round(TotalSearches * POSTAGE_RATIO);

const build = () => Promise.join(
  query.searchTotals(true),
  query.searchTotals(false),
  (allTime, todaySearches) => ({
    allTime,
    todaySearches,
    customerCostSaving: costSaving(allTime)
  })
);

module.exports = build;
