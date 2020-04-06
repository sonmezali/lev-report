'use strict';

const config = require('../config');
const query = config.postgres.mock ? require('../../mock/mock-query') : require('./db/query');

/**
 * Martin's Multiplier `M`, an estimated ratio of relevant searches in the audit table, currently 55%
 * @type {number}
 */
const M = 0.55;
/**
 * Cost of a Second Class "Signed for" letter from Royal Mail: £1.81
 * @type {number}
 */
const p = 1.81;
const Mp = M * p;
/**
 * costSaving calculates the approximate cost saving to the public from not having to send certificates by post
 * @param T Total searches done to date
 * @returns {number} the approximate cost saving to the public
 */
const costSaving = T => Math.round(T * Mp);

const build = () => Promise.join(
  query.searchTotals(true),
  query.searchTotals(false),
  (allTime, todaySearches) => ({
    allTime,
    todaySearches,
    customerCostSaving: costSaving(todaySearches)
  })
);

module.exports = build;
