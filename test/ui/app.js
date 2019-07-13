'use strict';

const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom-global');
const mock = require('mock-require');
const rewire = require('rewire');
const proxyquire = require('proxyquire');
const moment = require('moment');
const fixture = fs.readFileSync(path.resolve(__dirname, '../../pages/index.html'));
const fixtureData = ['datatype traces'];

describe('UI', () => {
  let app;
  let cleanup;
  let fakeServer;
  let xhr;
  const plot = sinon.spy();
  // mock('plotly.js-dist', {
  //   newPlot: plot
  // });

  before('setup', () => {
    // setup fake dom (and create `global.XMLHttpRequest`)
    cleanup = jsdom(fixture, {
      url: 'http://report.lev/',
      contentType: 'text/html'
    });
    // reload `fake-xhr` now that `global.XMLHttpRequest` exists
    xhr = rewire('nise/lib/fake-xhr');
    // reload `fake-server` and ensure it uses the new `fake-xhr`
    fakeServer = proxyquire('nise/lib/fake-server', {
      '../fake-xhr': xhr
    });
    // ensure the fake dom uses the fake server for XHRs
    global.XMLHttpRequest = xhr.FakeXMLHttpRequest;
    // finally load the app code now environment is mocked and ready to test
    app = rewire('../../assets/js/app');
  });

  after('cleanup', () => {
    fakeServer.restore();
    cleanup();
  });

  describe('options form', () => {
    let el;
    let formBlocked;

    before(() => {
      el = document.getElementById('options');
      formBlocked = app.__get__('formBlocked');
    });

    it('should be a form element', () => expect(el).to.have.property('tagName', 'FORM'));

    it('should not be blocked', () => expect(formBlocked()).to.be.false);

    describe('submit handler', () => {
      let submitHandler;

      before(() => {
        submitHandler = app.__get__('handleSubmit');
      });

      it('should be the "handleSubmit" function', () =>
        expect(el)
          .and.have.property('onsubmit')
          .that.equals(submitHandler));

      describe('when the form is submitted', () => {
        let server;
        const thisMonthURL = `/data?fromDate=${moment().format('YYYY-MM')}-01 00:00:00:000`;

        before(() => {
          server = fakeServer.create();
          server.respondWith(
            'GET',
            thisMonthURL,
            [200, { 'Content-Type': 'application/json' }, JSON.stringify(fixtureData)]);
          server.respondWith(
            'GET',
            'http://report.lev/data?fromDate=3000-01-01 00:00:00:000',
            [400, { 'Content-Type': 'text/plain' }, 'Future date!']);
        });

        describe('with no options set', () => {
          const event = { preventDefault: sinon.spy() };

          before(() => {
            submitHandler(event);
          });

          it('should prevent the default form submission', () => expect(event.preventDefault).to.have.been.calledOnce);

          it('should be blocked, so the form cannot be used', () => expect(formBlocked()).to.be.true);

          it('should send a request to the server', () =>
            expect(server.requests)
              .to.be.an('array')
              .that.has.lengthOf(1));

          it('should request data from the start of the month', () =>
            expect(server.requests[0])
              .to.be.an('object')
              .that.has.property('url', thisMonthURL));

          it('should still be blocked', () => expect(formBlocked()).to.be.true);

          describe('when the server returns data', () => {
            before(() => {
              server.respond();
            });

            // it('should have plotted a graph', () =>
              // expect(plot)
              //   .to.have.been.calledOnce
              //   .and.to.have.been.calledWithExactly('graph', fixtureData, {
              //     barmode: 'stack',
              //     title: 'LEV usage so far this month'
              //   }));

            it('should be unblocked, so the form can be used again', () => expect(formBlocked()).to.be.false);
          });
        });
      });
    });
  });
});
