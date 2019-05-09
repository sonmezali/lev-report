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
          .that.deep.equals(['2000-01-30', '2000-01-31', '2000-02-01', '2000-02-02'])
      );
      describe('when the optional date format string is supplied', () => {
        it('should produce a formatted array of dates, starting at "dateFrom", finishing at "dateTo"', () =>
          expect(fn(dateFrom, dateTo, 'D MMM'))
            .to.be.an('array')
            .that.deep.equals(['30 Jan', '31 Jan', '1 Feb', '2 Feb'])
        );
      });
    });

    describe('inity', () => {
      const fn = model.__get__('inity');

      it('should be a function that takes 2 parameters', () =>
        expect(fn)
          .to.be.a('function')
          .that.has.length(2)
      );

      describe('when called', () => {
        it('should return a factory function', () =>
          expect(fn('2000-01-30', '2000-02-02'))
            .to.be.a('function')
            .that.has.length(0)
        );

        describe('the factory function', () => {
          it('should create an object with each date between the 2 specified dates, and their values set to 0', () =>
            expect(fn('2000-01-30', '2000-02-02')())
              .that.is.an('object')
              .that.deep.equals({
              '2000-01-30': 0,
              '2000-01-31': 0,
              '2000-02-01': 0,
              '2000-02-02': 0
            })
          );
        });
      });
    });

    describe('initModel', () => {
      const fn = model.__get__('initModel');
      const keys = ['birth', 'death', 'marriage'];
      const traceKeys = ['name', 'x', 'y', 'type', 'hoverinfo', 'textposition', 'opacity', 'marker'];
      const dates = [];
      const init = { init: 'obj' };
      const inity = () => init;
      let result;

      before(() => {
        result = fn(keys, dates, inity);
      });

      it('should initialise the model with a trace object', () =>
        expect(result)
          .to.be.an('object')
          .that.has.property('birth')
          .which.has.keys(traceKeys)
      );
      it('should have a trace object for each "datatype"', () => {
        expect(result).to.have.keys(keys);
        expect(result).to.have.property('death').that.has.keys(traceKeys);
        expect(result).to.have.property('marriage').that.has.keys(traceKeys);
      });
      it('should initialise the trace objects with the "dates" array', () =>
        expect(result)
          .to.have.nested.property('birth.x')
          .that.deep.equals(dates)
      );
      it('should initialise the trace objects with the "inity" object', () =>
        expect(result)
          .to.have.nested.property('birth.y')
          .that.deep.equals(init)
      );
    });

    describe('model mutators', () => {
      const y = { '2000-01-01': 0, '2000-01-02': 0, '2000-01-03': 0 };
      const mdl = { birth: { y: y } };

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
            .that.has.deep.equals({ birth: { y: {
                '2000-01-01': 5,
                '2000-01-02': 2,
                '2000-01-03': 4
              }}})
        );

        describe('when extra data is available', () => {
          it('should not bork horribly because there is no associated datatype', () =>
            expect(fn(mdl, [{ date: '2000-01-01', dataset: 'death', count: 5 }])).not.to.throw
          );
        });
      });

      describe('unobjectifyy', () => {
        before(() => {
          model.__get__('unobjectifyy')(mdl);
        });

        it('should translate the "y" day->count map to an array of count values', () =>
          expect(mdl.birth.y)
            .to.be.an('array')
            .that.deep.equals([5, 2, 4])
        );
      });

      describe('addTraceText', () => {
        before(() => {
          model.__get__('addTraceText')(mdl);
        });

        it('should add the text values to the trace objects', () =>
          expect(mdl.birth)
            .to.have.property('text')
            .that.is.an('array')
            .that.deep.equals(['5', '2', '4'])
        );
      });
    });

  });
});
