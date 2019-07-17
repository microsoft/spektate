
import { initializeIcons } from 'office-ui-fabric-react/lib/Icons';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import './css/dashboard.css';
import Dashboard from './Dashboard';
import registerServiceWorker from './registerServiceWorker';

initializeIcons();
ReactDOM.render(
  <Dashboard />,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();
