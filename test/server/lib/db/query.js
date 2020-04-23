'use strict';

const proxyquire = require('proxyquire');
const fixtures = require('./query.fixtures');
const rewire = require('rewire');
const query = rewire('../../../../src/lib/db/query');
const stubs = {
	one: sinon.stub().resolves(),
	manyOrNone: sinon.stub().resolves()
};
const fakeQuery = proxyquire('../../../../src/lib/db/query', {
	'./postgres': stubs
});

describe('lib/db/query', () => {
	describe('helper functions', () => {
		describe('filterObject', () => {
			// eslint-disable-next-line no-underscore-dangle
			const fn = query.__get__('filterObject');
			it('should filter empty fields from an object', () =>
				expect(fn({ field: undefined }))
					.to.be.an('object')
					.that.is.empty
			);
			it('should not filter non-empty fields from an object', () =>
				expect(fn({ field: 'value' }))
					.to.be.an('object')
					.that.deep.equals({ field: 'value' })
			);
			it('should filter empty fields from an object', () =>
				expect(fn({ field1: 'value1', emptyField1: undefined, field2: 'value2', EmptyField2: undefined }))
					.to.be.an('object')
					.that.deep.equals({ field1: 'value1', field2: 'value2' })
			);
		});

		describe('sqlBuilder', () => {
			// eslint-disable-next-line no-underscore-dangle
			const fn = query.__get__('sqlBuilder');
			describe('takes parts of an SQL string as an object, and returns a complete SQL query string', () => {
				describe('simple select query', () => {
					it('should return a query, built from the select field', () =>
						expect(fn({ 'SELECT': '"my name is Colin"' }))
							.to.be.a('string')
							.that.equals('SELECT "my name is Colin"')
					);
					it('should only use the necessary fields from the object', () =>
						expect(fn({ 'SELECT': '1', 'FROM': undefined, 'WHERE': false, 'GROUP BY': null }))
							.to.be.a('string')
							.that.equals('SELECT 1')
					);

					describe('with a from field', () => {
						it('should return a query, built from the select and from fields', () =>
							expect(fn({
								'SELECT': 'COUNT(lemons)',
								'FROM': 'lemon_tree'
							}))
								.to.be.a('string')
								.that.equals('SELECT COUNT(lemons) FROM lemon_tree')
						);
					});
				});

				describe('select with filters', () => {
					it('should return a query, built from the select, from and where fields', () =>
						expect(fn({
							'SELECT': 'date_time::DATE AS date, dataset, username, count(*)::INTEGER',
							'FROM': 'my_table',
							'WHERE': 'date_time > $date'
						}))
							.to.be.a('string')
							.that.equals('SELECT date_time::DATE AS date, dataset, username, count(*)::INTEGER ' +
							'FROM my_table WHERE date_time > $date')
					);
					it('should return a query, built from the select, from and where fields, with multiple filters', () =>
						expect(fn({
							'SELECT': 'date_time::DATE AS date, dataset, username, count(*)::INTEGER',
							'FROM': 'lev_audit',
							'WHERE': ['date_time > $date', 'dataset = 4', 'username LIKE \'colin%\'']
						}))
							.to.be.a('string')
							.that.equals('SELECT date_time::DATE AS date, dataset, username, count(*)::INTEGER ' +
							'FROM lev_audit WHERE date_time > $date AND dataset = 4 AND username LIKE \'colin%\'')
					);
					it('should return a query, built from the select, from and where fields, with multiple empty filters', () =>
						expect(fn({
							'SELECT': 'date_time::DATE AS date, dataset, username, count(*)::INTEGER',
							'FROM': 'lev_audit',
							'WHERE': [false, 'dataset = 4', 'blah', '', null, undefined]
						}))
							.to.be.a('string')
							.that.equals('SELECT date_time::DATE AS date, dataset, username, count(*)::INTEGER ' +
							'FROM lev_audit WHERE dataset = 4 AND blah')
					);
					const group = false;
					it('should return a query, built from multiple empty filters (EXAMPLE)', () =>
						expect(fn({
							'SELECT': 'date_time::DATE AS date, dataset, username, count(*)::INTEGER',
							'FROM': 'lev_audit',
							'WHERE': ['dataset = 4', group && 'group=$group', undefined]
						}))
							.to.be.a('string')
							.that.equals('SELECT date_time::DATE AS date, dataset, username, count(*)::INTEGER ' +
							'FROM lev_audit WHERE dataset = 4')
					);
				});

				describe('select with grouping', () => {
					const sqlObj = {
						'SELECT': 'first_name, surname, COUNT(*)',
						'FROM': 'aTable',
						'GROUP BY': 'first_name, surname'
					};

					it('should return a query, built from the select, from and grouping fields', () =>
						expect(fn(sqlObj))
							.to.be.a('string')
							.that.equals('SELECT first_name, surname, COUNT(*) FROM aTable GROUP BY first_name, surname')
					);

					describe('when a custom "joiner" is specified', () => {
						it('should return the same query, using the specified "joiner" character', () =>
							expect(fn(sqlObj, '\n'))
								.to.be.a('string')
								.that.equals('SELECT first_name, surname, COUNT(*)\nFROM aTable\nGROUP BY first_name, surname')
						);
						it('should return the same query, using the specified "joiner" string', () =>
							expect(fn(sqlObj, '\n  '))
								.to.be.a('string')
								.that.equals('SELECT first_name, surname, COUNT(*)\n  FROM aTable\n  GROUP BY first_name, surname')
						);
					});
				});
			});
		});
	});

	describe('searchTotals function', () => {
		describe('when `true` is provided', () => {
			before(() => {
				stubs.one.resetHistory();
				fakeQuery.searchTotals(true);
			});
			it('should pass SQL to the database library', () =>
				expect(stubs.one).to.have.been.calledOnce
					.and.to.have.been.calledWith(fixtures.searchTotals.totalCountSQL)
			);
		});

		describe('when `false` is provided', () => {
			before(() => {
				stubs.one.resetHistory();
				fakeQuery.searchTotals(false);
			});
			it('should pass SQL to the database library with the "today" where clause', () =>
				expect(stubs.one).to.have.been.calledOnce
					.and.to.have.been.calledWith(fixtures.searchTotals.todayCountSQL)
			);
		});
	});

	describe('searchTimePeriodByGroup function', () => {
		const from = '2000-01-30';
		const to = '2000-02-02';
		const group = 'HMRC';
		before(() => {
			stubs.one.resetHistory();
			fakeQuery.searchTimePeriodByGroup(from, to, group);
		});
		it('should build an sql statement when `to, from and group` are provided', () =>
			expect(stubs.one).to.have.been.calledOnce
				.and.to.have.been.calledWith(fixtures.searchTimePeriodByGroup.fromToGroupSQL, { from, to, group })
		);
		describe('when function is called with empty dates', () => {
			before(() => {
				stubs.one.resetHistory();
				fakeQuery.searchTimePeriodByGroup('', '', group);
			});
			it('should build an sql statement when to and from dates are not provided', () =>
				expect(stubs.one).to.have.been.calledOnce
					.and.to.have.been.calledWith(fixtures.searchTimePeriodByGroup.gorupOnlySQL, { group })
			);
		});
	});
});
