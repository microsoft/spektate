import * as React from 'react';
import AzureDevOpsPipeline from "./clients/AzureDevOpsPipeline";
import './css/dashboard.css';

class Dashboard extends React.Component {
  public render() {
    const pipeline = new AzureDevOpsPipeline("epicstuff", "bedrock", 4676);
    pipeline.getBuildLogs();
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Bedrock Visualization Dashboard Prototype</h1>
        </header>
      </div>
    );
  }

}

export default Dashboard;
