import * as React from 'react';
import './css/dashboard.css';
import Deployment from "./models/Deployment";
import AzureDevOpsPipeline from "./models/pipeline/AzureDevOpsPipeline";

export interface IDashboardState{
  deployments: Deployment[]
}
class Dashboard extends React.Component<{}, IDashboardState> {
  constructor(props:{}) {
    super(props);
    this.state = {
      deployments: []
    };
    this.getDeployments();
  }
  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Bedrock Visualization Dashboard Prototype</h1>
        </header>
        {this.renderPrototypeTable()}
      </div>
    );
  }

  public renderPrototypeTable() {
    const rows = [] as any[];
    let counter = 0;
    this.state.deployments.forEach((deployment) => {
      rows.push(<tr key={counter}>
                  <td>{deployment.commitId}</td>
                  <td>{deployment.srcToDockerBuild.id}</td>
                  <td>{deployment.srcToDockerBuild.startTime.toLocaleString()}</td>
                  <td>{deployment.srcToDockerBuild.sourceBranch.replace("refs/heads/", "")}</td>
                  <td>{deployment.imageTag}</td>
                  <td>{deployment.srcToDockerBuild.result}</td>
                  <td>{deployment.dockerToHldRelease ? deployment.dockerToHldRelease!.id : ""}</td>
                  <td>{deployment.hldCommitId}</td>
                  <td>{deployment.dockerToHldRelease ? deployment.dockerToHldRelease!.status : ""}</td>
                  <td>{deployment.hldToManifestBuild ? deployment.hldToManifestBuild!.id : ""}</td>
                  <td>{deployment.hldToManifestBuild ? deployment.hldToManifestBuild!.finishTime.toLocaleString() : ""}</td>
                  <td>{deployment.hldToManifestBuild ? deployment.hldToManifestBuild!.result : ""}</td>
                  <td>{(deployment.hldToManifestBuild ? Number((deployment.hldToManifestBuild!.finishTime.valueOf() - deployment.srcToDockerBuild.startTime.valueOf())/60000).toFixed(2) + " minutes" : "-")}</td>
                </tr>);
        counter++;
    });
    return (<table>
          <thead>
            <tr>
              <th>Commit</th>
              <th>SRC to ACR</th>
              <th>Start Time</th>
              <th>Source Branch</th>
              <th>Image Version</th>
              <th>Status</th>
              <th>ACR to HLD</th>
              <th>Commit</th>
              <th>Status</th>
              <th>HLD to Manifest</th>
              <th>End Time</th>
              <th>Status</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>);
  
  }

  public getDeployments = () => {
    const srcPipeline = new AzureDevOpsPipeline("epicstuff", "hellobedrock", 101);
    const hldPipeline = new AzureDevOpsPipeline("epicstuff", "hellobedrock", 1, true);
    const clusterPipeline = new AzureDevOpsPipeline("epicstuff", "hellobedrock", 102);
    Deployment.getDeployments("hello-bedrock", srcPipeline, hldPipeline, clusterPipeline, (deployments: Deployment[]) => {
      this.setState({deployments});
    });
    return <div />;
  }

}

export default Dashboard;
