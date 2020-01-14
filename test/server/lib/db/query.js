'use strict';

const proxyquire = require('proxyquire');
const rewire = require('rewire');
const query = rewire('../../../../src/lib/db/query');

describe('lib/db/query', () => {
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
});
