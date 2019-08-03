
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import * as React from 'react';
import { config } from "./config";
import './css/dashboard.css';
import Deployment from "./models/Deployment";
import AzureDevOpsPipeline from "./models/pipeline/AzureDevOpsPipeline";
import { Author } from './models/repository/Author';
import { GitHub } from './models/repository/GitHub';
import { Repository } from './models/repository/Repository';

export interface IAuthors {
  [commitId: string]: Author;
}
export interface IDashboardState{
  deployments: Deployment[],
  manifestSync: string,
  authors: IAuthors
}
class Dashboard extends React.Component<{}, IDashboardState> {
  constructor(props:{}) {
    super(props);
    this.state = {
      authors: {},
      deployments: [],
      manifestSync: ""
    };
      this.getDeployments();
  }
  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Container Journey Prototype</h1>
        </header>
        {this.renderPrototypeTable()}
      </div>
    );
  }

  public renderPrototypeTable = () => {
    if (this.state.deployments.length === 0) {
      return <Spinner size={SpinnerSize.large} />;
    }
    const rows = [] as any[];
    let counter = 0;
    const state = this.state;
    this.state.deployments.forEach((deployment) => {
      const author = this.getAuthor(deployment);
      rows.push(<tr key={counter}>
                  <td>{deployment.srcToDockerBuild ? deployment.srcToDockerBuild.startTime.toLocaleString() : "-"}</td>
                  <td>{deployment.srcToDockerBuild ? deployment.srcToDockerBuild.sourceBranch.replace("refs/heads/", "") : "-"}</td>
                  <td>{deployment.imageTag}</td>
                  <td>{deployment.srcToDockerBuild ? <a href={deployment.srcToDockerBuild.sourceVersionURL}>{deployment.commitId}</a> : "-" }</td>
                  <td>{deployment.srcToDockerBuild ? <a href={deployment.srcToDockerBuild.URL}>{deployment.srcToDockerBuild.id}</a> : "-"}</td>
                  <td>{deployment.srcToDockerBuild ? this.getIcon(deployment.srcToDockerBuild.result) : "-"}</td>
                  <td>{deployment.dockerToHldRelease ? <a href={deployment.dockerToHldRelease.URL}>{deployment.dockerToHldRelease!.id}</a> : "-"}</td>
                  <td>{deployment.environment}</td>
                  <td>{deployment.dockerToHldRelease ? this.getIcon(deployment.dockerToHldRelease!.status) : "-"}</td>
                  <td>{deployment.hldToManifestBuild ? <a href={deployment.hldToManifestBuild.sourceVersionURL}>{deployment.hldCommitId}</a> : deployment.hldCommitId}</td>
                  <td>{deployment.hldToManifestBuild ? <a href={deployment.hldToManifestBuild.URL}>{deployment.hldToManifestBuild!.id}</a> : "-"}</td>
                  <td>{deployment.hldToManifestBuild ? this.getIcon(deployment.hldToManifestBuild!.result) : "-"}</td>
                  <td>{deployment.duration()} mins</td>
                  <td>{deployment.status()}</td>
                  <td>{author !== undefined ? <a href={author.URL}>{author.name}</a> : ""}</td>
                  <td>{deployment.manifestCommitId === state.manifestSync ? "Synced" : ""}</td>
                  <td>{deployment.hldToManifestBuild ? (Number.isNaN(deployment.hldToManifestBuild!.finishTime.valueOf()) ? "-" : deployment.hldToManifestBuild!.finishTime.toLocaleString()) : "-"}</td>
                </tr>);
        counter++;
    });
    return (<table>
          <thead>
            <tr>
              <th>Start Time</th>
              <th>Source Branch</th>
              <th>Image Version</th>
              <th>Commit</th>
              <th>SRC to ACR</th>
              <th>Result</th>
              <th>ACR to HLD</th>
              <th>Environment</th>
              <th>Result</th>
              <th>Commit</th>
              <th>HLD to Manifest</th>
              <th>Result</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Author</th>
              <th>Cluster Sync</th>
              <th>End Time</th>
            </tr>
          </thead>
          <tbody>
            {rows}
          </tbody>
        </table>);
  
  }

  public getDeployments = () => {
    const srcPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.SRC_PIPELINE_ID);
    const hldPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.DOCKER_PIPELINE_ID, true);
    const clusterPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.HLD_PIPELINE_ID);

    const manifestRepo: Repository = new GitHub(config.GITHUB_MANIFEST_USERNAME, config.GITHUB_MANIFEST);
    manifestRepo.getManifestSyncState((syncCommit) => {
      this.setState({manifestSync: syncCommit});
    });
    Deployment.getDeployments(config.STORAGE_PARTITION_KEY, srcPipeline, hldPipeline, clusterPipeline, (deployments: Deployment[]) => {
      this.setState({deployments});
      this.getAuthors();
    });
    return <div />;
  }

  private getAuthors = () => {
    const state = this.state;
    this.state.deployments.forEach((deployment) => {
      if (deployment.srcToDockerBuild && !(deployment.srcToDockerBuild.sourceVersion in state.authors)) {
        deployment.fetchAuthor((author: Author) => {
          if (author && deployment.srcToDockerBuild) {
            const copy = state.authors;
            copy[deployment.srcToDockerBuild.sourceVersion] = author;
            this.setState({authors: copy});
          }
        });
      }
    });
  }

  private getAuthor = (deployment: Deployment): Author | undefined => {
    if (deployment.srcToDockerBuild && deployment.srcToDockerBuild.sourceVersion in this.state.authors) {
      return this.state.authors[deployment.srcToDockerBuild.sourceVersion];
    }
    return undefined;
  }

  private getIcon(status: string): React.ReactElement {
    if(status === "succeeded") {
      return <Icon style={{color: "green"}} iconName="CompletedSolid" />;
    } else if (status === undefined || status === "inProgress") {
      return <Icon style={{color: "blue"}} iconName="SkypeCircleClock" />; // SyncStatusSolid
    }
    return <Icon style={{color: "#c80000"}} iconName="StatusErrorFull" />;
  }
}

export default Dashboard;
