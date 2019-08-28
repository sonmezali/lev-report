'use strict';

const moment = require('moment');
const rewire = require('rewire');
const model = rewire('../../../src/lib/model');

describe('lib/model', () => {
  describe('helper function', () => {
    describe('objPush adds a field to an object', () => {
      const fn = model.__get__('objPush');
      const obj = {};
      const key = 'a-key';
      const value = 'a value';
      it('should add "key" and "value" to an object', () =>
        expect(fn({}, key, value))
          .to.be.an('object')
          .that.deep.equals({ 'a-key': value })
      );
      it('should add "key" and "value", and return the mutated "obj"', () =>
        expect(fn(obj, key, value)).that.equals(obj)
      );
    });

    describe('datesInRange', () => {
      const fn = model.__get__('datesInRange');
      const dateFrom = moment('2000-01-30');
      const dateTo = moment('2000-02-02');

      it('should produce an array of dates, starting at "dateFrom", finishing at "dateTo"', () =>
        expect(fn(dateFrom, dateTo))
          .to.be.an('array')
          .that.deep.equals([949190400000, 949276800000, 949363200000])
      );
    });

    describe('model mutators', () => {
      const mdl = { birth: [] };

      describe('insertData', () => {
        const fn = model.__get__('insertData');
        const data = [
          { date: '2000-01-01', dataset: 'birth', count: 5 },
          { date: '2000-01-02', dataset: 'birth', count: 2 },
          { date: '2000-01-03', dataset: 'birth', count: 4 }
        ];

        before(() => {
          fn(mdl, data);
        });

        it('should fill the given "model" with the specified "data"', () =>
          expect(mdl)
            .to.be.an('object')
            .that.has.deep.equals({ birth: [
              { date: 946684800000, usage: 5 },
              { date: 946771200000, usage: 2 },
              { date: 946857600000, usage: 4 }
            ]})
        );

        describe('when extra data is available', () => {
          it('should not bork horribly because there is no associated datatype', () =>
            expect(fn(mdl, [{ date: '2000-01-01', dataset: 'death', count: 5 }])).not.to.throw
          );
        });
      });
    });

  });
});
