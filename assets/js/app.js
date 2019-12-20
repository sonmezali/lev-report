'use strict';

const React = require('react');
const ReactDOM = require('react-dom');
const DashboardContent = require('lev-react-components').DashboardContent;

document.body.onload = () => {
  ReactDOM.hydrate(
    React.createElement(DashboardContent, window.dashboardProps, null),
    document.getElementById('content')
  );
};
