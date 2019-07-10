import * as React from 'react';
import './css/dashboard.css';
import AzureDevOpsPipeline from "./models/pipeline/AzureDevOpsPipeline";

class Dashboard extends React.Component {
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
    const srcPipeline = new AzureDevOpsPipeline("epicstuff", "bedrock", 74);
    const builds1 = srcPipeline.getListOfBuilds();
    const hldPipeline = new AzureDevOpsPipeline("epicstuff", "bedrock", 1, true);
    const builds2 = hldPipeline.getListOfReleases();
    const clusterPipeline = new AzureDevOpsPipeline("epicstuff", "bedrock", 90);
    const builds3 = clusterPipeline.getListOfBuilds();

    const rows = [];
    for (let i = 0; i < 50; i++) {
      const row = (<tr>
                    <td><a href={builds1[i].sourceVersionURL}>{builds1[i].sourceVersion.substring(0, 7)}</a></td>
                    <td><a href={builds1[i].URL}>{builds1[i].id}</a></td>
                    <td>{builds1[i].startTime}</td>
                    <td>{builds1[i].sourceBranch.replace("refs/heads/", "")}</td>
                    <td>{builds1[i].result}</td>
                    <td><a href={builds2[i].URL}>{builds2[i].id}</a></td>
                    <td>{builds2[i].status}</td>
                    <td>{builds2[i].imageVersion}</td>
                    <td><a href={builds3[i].URL}>{builds3[i].id}</a></td>
                    <td>{builds3[i].startTime}</td>
                    <td>{builds3[i].result}</td>
                    <td><a href={builds3[i].sourceVersionURL}>{builds3[i].sourceVersion.substring(0, 7)}</a></td>
                  </tr>);
      rows.push(row);
    }

    return (<table>
              <thead>
                <th>Commit</th>
                <th>SRC to ACR</th>
                <th>Start Time</th>
                <th>Source Branch</th>
                <th>Status</th>
                <th>ACR to HLD</th>
                <th>Status</th>
                <th>Image Version</th>
                <th>HLD to Manifest</th>
                <th>Time</th>
                <th>Status</th>
                <th>Commit</th>
              </thead>
              <tbody>
                {rows}
              </tbody>
            </table>);
  }

}

export default Dashboard;
