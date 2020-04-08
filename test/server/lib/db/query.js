'use strict';

const proxyquire = require('proxyquire');
const rewire = require('rewire');
const query = rewire('../../../../src/lib/db/query');

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
					it('should return a query, built from the select, from and grouping fields', () =>
						expect(fn({
							'SELECT': 'first_name, surname, COUNT(*)',
							'FROM': 'aTable',
							'GROUP BY': 'first_name, surname'
						}))
							.to.be.a('string')
							.that.equals('SELECT first_name, surname, COUNT(*) FROM aTable GROUP BY first_name, surname')
					);
				});
			});
		});
	});

	describe('searchTotals function', () => {
		// eslint-disable-next-line no-underscore-dangle
		const totalCountSQL = query.__get__('totalCount');
		// eslint-disable-next-line no-underscore-dangle
		const forTodaySQL = query.__get__('forToday');
		let fakeQuery;
		let stub;
		before(() => {
			stub = sinon.stub();
			stub.returns(Promise.resolve());
			fakeQuery = proxyquire('../../../../src/lib/db/query', {
				'./postgres': { one: stub }
			});
		});
		describe('when `true` is provided', () => {
			it('should return a promise', () =>
				expect(fakeQuery.searchTotals(true))
					.to.be.an.instanceOf(Promise)
					.that.is.fulfilled
			);
			it('should pass SQL to the database library', () =>
				expect(stub).to.have.been.calledOnce
					.and.to.have.been.calledWith(totalCountSQL)
			);
		});
		describe('when `false` is provided', () => {
			before(() => {
				stub.resetHistory();
			});
			it('should return a promise', () =>
				expect(fakeQuery.searchTotals(false))
					.to.be.an.instanceOf(Promise)
					.that.is.fulfilled
			);
			it('should pass SQL to the database library with the "today" where clause', () =>
				expect(stub).to.have.been.calledOnce
					.and.to.have.been.calledWith(totalCountSQL + forTodaySQL)
			);
		});
	});

	describe('searchTimePeriodByGroup function', () => {
		const dateFrom = '2000-01-30';
		const dateTo = '2000-02-02';
		const group = 'HMRC';
		let fakeQuery;
		let stub;
		before(() => {
			stub = sinon.stub();
			stub.returns(Promise.resolve());
			fakeQuery = proxyquire('../../../../src/lib/db/query', {
				'./postgres': { one: stub }
			});
		});
		describe('when function is called with arguments', () => {
			it('should return a promise', () =>
				expect(fakeQuery.searchTimePeriodByGroup(dateFrom, dateTo, group))
					.to.be.an.instanceOf(Promise)
					.that.is.fulfilled
			);
			it('should build an sql statement when `to, from and group` are provided', () =>
				expect(stub).to.have.been.calledOnce
					.and.to.have.been.calledWith('SELECT count(*)::INTEGER FROM lev_audit ' +
					'WHERE (date_time AT TIME ZONE \'europe/london\')::DATE >= $(from) AND ' +
					'(date_time AT TIME ZONE \'europe/london\')::DATE < $(to) ' +
					'AND groups::TEXT ILIKE \'%\' || $(group) || \'%\'')
			);
		});
		describe('when function is called with empty dates', () => {
			before(() => {
				stub.resetHistory();
			});
			it('should return a promise', () =>
				expect(fakeQuery.searchTimePeriodByGroup('', '', group))
					.to.be.an.instanceOf(Promise)
					.that.is.fulfilled
			);
			it('should build an sql statement when to and from dates are not provided', () =>
				expect(stub).to.have.been.calledOnce
					.and.to.have.been.calledWith('SELECT count(*)::INTEGER FROM lev_audit ' +
					'WHERE groups::TEXT ILIKE \'%\' || $(group) || \'%\'')
			);
		});
	});
});
