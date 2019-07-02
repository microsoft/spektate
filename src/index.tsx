import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './css/dashboard.css';
import Dashboard from './dashboard';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(
  <Dashboard />,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
