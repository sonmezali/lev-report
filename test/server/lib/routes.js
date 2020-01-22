'use strict';

const moment = require('moment');
const rewire = require('rewire');
const routes = rewire('../../../src/lib/routes');

describe('lib/routes', () => {
	describe('helper functions', () => {
		describe('dateChecker', () => {
			const fn = routes.__get__('dateChecker');
			describe('checks for invalid dates', () => {
				it('should return false if input is empty', () =>
					expect(fn(''))
						.to.be.false
				);
				it('should return an invalid moment object created from the input', () => {
					let ret = fn('2019-09-50');
					expect(ret)
						.to.be.an('object')
						.that.is.an.instanceOf(moment);
					return expect(ret.isValid())
						.to.be.false;
				});
			});
			describe('checks for valid dates', () => {
				it('should return a valid moment object created from the input', ()=> {
					let ret = fn('2019-09-03');
					expect(ret)
						.to.be.an('object')
						.that.is.an.instanceOf(moment);
					return expect(ret.isValid())
						.to.be.true;
				});
			});
		});
	});
});
