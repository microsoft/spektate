import * as React from 'react';
import AzureDevOpsPipeline from "./clients/AzureDevOpsPipeline";
import './css/dashboard.css';

class Dashboard extends React.Component {
  public render() {
    const srcPipeline = new AzureDevOpsPipeline("epicstuff", "bedrock", 74);
    srcPipeline.getListOfBuilds();
    const hldPipeline = new AzureDevOpsPipeline("epicstuff", "bedrock", 76);
    hldPipeline.getListOfBuilds();
    const clusterPipeline = new AzureDevOpsPipeline("epicstuff", "bedrock", 90);
    clusterPipeline.getListOfBuilds();
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
