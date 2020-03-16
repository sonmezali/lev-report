const daily = require('./daily-counts');
const totals = require('./dataset-totals');
const groups = require('./group-data');
const dailySearches = Math.round(Math.random() * 5000);
const allTime = Math.round(Math.random() * 1000000);
const allTimeCustomerSearches = Math.round(Math.random() * 100000000);

module.exports = {
  usageByDateType: () => Promise.resolve(daily),
  usageByType: () => Promise.resolve(totals),
  usageByGroup: () => Promise.resolve(groups),
  searchTotals: (isAllTimeCount) => Promise.resolve(isAllTimeCount ? allTime : dailySearches),
  totalCustomerSearches: () => Promise.resolve(allTimeCustomerSearches)
};
