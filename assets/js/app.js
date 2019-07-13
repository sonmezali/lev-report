'use strict';

const moment = require('moment');

const HUMAN_FORMAT = 'D/M/YYYY';
const SERVER_FORMAT = 'YYYY-MM-DD HH:mm:ss:SSS';

const submit = document.getElementById('submit');
const blockForm = () => submit.disabled = true;
const unblockForm = () => submit.disabled = false;
const formBlocked = () => submit.disabled;

const stateChanged = (dateDescription, xhttp) => () => {
  if (xhttp.readyState === 4) {
    if (xhttp.status === 200) {
      const data = JSON.parse(xhttp.responseText);
      // const layout = {
      //   title: `LEV usage ${dateDescription}`,
      //   barmode: 'stack'
      // };

      // here!
      console.log(data);
    } else {
      console.log('HTTP ERROR:', xhttp.status, xhttp.statusText);
    }
    unblockForm();
  } else {
    console.log(`Update (${xhttp.readyState}):`, xhttp.status, xhttp.statusText);
  }
};
const handleSubmit = event => {
  event.preventDefault();

  if (formBlocked()) {
    return;
  }

  let from = document.getElementById('fromDate').value;
  let to = document.getElementById('toDate').value;
  to = to && moment(to);
  from = from && moment(from);
  let dateDescription = 'so far this month';
  let url = '/data?';

  if (from && from.isValid()) {
    dateDescription = `since ${from.format(HUMAN_FORMAT)}`;

    if (to && to.isValid()) {
      dateDescription = `between ${from} and ${to}`;
      url += `toDate=${to.format(HUMAN_FORMAT)}&`;
    }
  } else {
    from = moment().startOf('month');
  }

  const xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = stateChanged(dateDescription, xhttp);
  xhttp.onabort = () => {
    console.log('Fetching usage ABORTED');
    unblockForm();
  };
  xhttp.onerror = () => {
    console.log('Error fetching usage data');
    unblockForm();
  };
  blockForm();
  url = `${url}fromDate=${from.format(SERVER_FORMAT)}`;
  console.log('Get data:', url);
  xhttp.open('GET', url, true);
  xhttp.send();
};

document.getElementById('options').onsubmit = handleSubmit;
