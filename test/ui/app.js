'use strict';

const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom-global');
const mock = require('mock-require');
const rewire = require('rewire');
const fixture = fs.readFileSync(path.resolve(__dirname, '../../pages/index.html'));

describe('UI', () => {

  let plot;
  let app;
  let cleanup;
  mock('plotly.js-dist', {
    newPlot: (plot = sinon.spy())
  });

  before('setup', () => {
    cleanup = jsdom(fixture, {
      url: 'http://report.lev/',
      contentType: 'text/html'
    });
    app = rewire('../../assets/js/app');
  });

  after('cleanup', () => {
    cleanup();
  });

  describe('options form', () => {
    let el;

    before(() => {
      el = document.getElementById('options');
    });

    it('should be a form element', () => expect(el).to.have.property('tagName', 'FORM'));

    describe('submit handler', () => {
      it('should be the "handleSubmit" function', () =>
        expect(el)
          .and.have.property('onsubmit')
          .that.equals(app.__get__('handleSubmit')));
    });
  });
});
