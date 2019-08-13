
import { DetailsList, DetailsListLayoutMode, IColumn } from 'office-ui-fabric-react/lib/DetailsList';
import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Spinner, SpinnerSize } from 'office-ui-fabric-react/lib/Spinner';
import * as React from 'react';
import { config } from "./config";
import './css/dashboard.css';
import Deployment from "./models/Deployment";
import AzureDevOpsPipeline from "./models/pipeline/AzureDevOpsPipeline";
import { Author } from './models/repository/Author';
import { GitHub } from './models/repository/GitHub';
// import { AzureDevOpsRepo } from './models/repository/AzureDevOpsRepo';
import { Repository } from './models/repository/Repository';

export interface IAuthors {
  [commitId: string]: Author;
}
export interface IDashboardState{
  deployments: Deployment[],
  manifestSync: string,
  authors: IAuthors
}
export interface IDeploymentField {
  startTime?: string;
  imageTag?: string;
  srcCommitId?: string;
  srcCommitURL?: string;
  srcPipelineId?: string;
  srcPipelineURL?: string;
  srcPipelineResult?: string;
  dockerPipelineId?: string;
  dockerPipelineURL?: string;
  environment?: string;
  dockerPipelineResult?: string;
  hldCommitId?: string;
  hldCommitURL?: string;
  hldPipelineId?: string;
  hldPipelineURL?: string;
  hldPipelineResult?: string;
  duration: string;
  status: string;
  clusterSync?: string;
  endTime?: string;
  authorName?: string;
  authorURL?: string;
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
          <h1 className="App-title">Bedrock Deployments</h1>
        </header>
        {this.renderNewPrototypeTable()}
        {/* {this.renderPrototypeTable()} */}
      </div>
    );
  }

  public renderNewPrototypeTable = () => {
    const columns: IColumn[] = [
      { key: 'startTime', name: 'Start Time', isResizable: true, minWidth: 80, maxWidth: 120, fieldName: 'startTime'},
      { key: 'imageTag', name: 'Image Tag', isResizable: true, minWidth: 100, maxWidth: 120, fieldName: 'imageTag'},
      { key: 'srcCommitId', name: 'Commit', isResizable: true, minWidth: 60, maxWidth: 120, onRender: (item) => <a href={item.srcCommitURL}>{item.srcCommitId}</a> },
      { key: 'srcPipelineId', name: 'SRC to ACR', isResizable: true, minWidth: 80, maxWidth: 120, onRender: (item) => <a href={item.srcPipelineURL}>{item.srcPipelineId}</a>},
      { key: 'srcPipelineResult', isResizable: true, name: 'Result',  maxWidth: 100, onRender: (item) => this.getIcon(item.srcPipelineResult), minWidth: 60},
      { key: 'dockerPipelineId', name: 'ACR to HLD', isResizable: true, minWidth: 100, maxWidth: 120, onRender: (item) => <a href={item.dockerPipelineURL}>{item.dockerPipelineId}</a>},
      { key: 'environment', name: 'Environment', isResizable: true, minWidth: 100, maxWidth: 120, fieldName: 'environment'},
      { key: 'dockerPipelineResult', name: 'Result', maxWidth: 100, onRender: (item) => this.getIcon(item.dockerPipelineResult), isResizable: true, minWidth: 60},
      { key: 'hldCommitId', name: 'Commit', isResizable: true, minWidth: 60, maxWidth: 120, onRender: (item) => <a href={item.hldCommitURL}>{item.hldCommitId}</a>},
      { key: 'hldPipelineId', name: 'HLD to Manifest', isResizable: true, minWidth: 100, maxWidth: 120, onRender: (item) => <a href={item.hldPipelineURL}>{item.hldPipelineId}</a>},
      { key: 'hldPipelineResult', name: 'Result', maxWidth: 100, onRender: (item) => this.getIcon(item.hldPipelineResult), isResizable: true, minWidth: 60},
      { key: 'duration', name: 'Duration', isResizable: true, minWidth: 60, maxWidth: 120, fieldName: 'duration'},
      { key: 'status', name: 'Status', isResizable: true, minWidth: 60, maxWidth: 120, fieldName: 'status'},
      { key: 'author', name: 'Author', isResizable: true, minWidth: 60, maxWidth: 120, onRender: (item) => <a href={item.authorURL}>{item.authorName}</a>},
      { key: 'clusterSync', name: 'Cluster-Sync', isResizable: true, minWidth: 70, maxWidth: 120, fieldName: 'clusterSync'},
      { key: 'endTime', name: 'End Time', isResizable: true, minWidth: 100,maxWidth: 120,  fieldName: 'endTime'}
    ];

    // tslint:disable-next-line: prefer-const
    let rows: IDeploymentField[] = [];
    this.state.deployments.forEach((deployment) => {
      const author = this.getAuthor(deployment);
      rows.push({
        startTime: deployment.srcToDockerBuild ? deployment.srcToDockerBuild.startTime.toLocaleString() : "-",
        // tslint:disable-next-line: object-literal-sort-keys
        imageTag: deployment.imageTag,
        srcCommitId: deployment.commitId,
        srcCommitURL: deployment.srcToDockerBuild ? deployment.srcToDockerBuild.sourceVersionURL : "",
        srcPipelineId: deployment.srcToDockerBuild ? deployment.srcToDockerBuild.id : "",
        srcPipelineURL: deployment.srcToDockerBuild ? deployment.srcToDockerBuild.URL : "",
        srcPipelineResult: deployment.srcToDockerBuild ? deployment.srcToDockerBuild.result : "-",
        dockerPipelineId: deployment.dockerToHldRelease ? deployment.dockerToHldRelease.id : "",
        dockerPipelineURL: deployment.dockerToHldRelease ? deployment.dockerToHldRelease.URL : "",
        environment: deployment.environment.toUpperCase(),
        dockerPipelineResult: deployment.dockerToHldRelease ? deployment.dockerToHldRelease.status : "-",
        hldCommitId: deployment.hldCommitId,
        hldCommitURL: deployment.hldToManifestBuild ? deployment.hldToManifestBuild.sourceVersionURL : "",
        hldPipelineId: deployment.hldToManifestBuild ? deployment.hldToManifestBuild.id : "",
        hldPipelineResult: deployment.hldToManifestBuild ? deployment.hldToManifestBuild.result : "-",
        hldPipelineURL: deployment.hldToManifestBuild ? deployment.hldToManifestBuild.URL : "",
        duration: deployment.duration() + " mins",
        authorName: author ? author.name : "",
        authorURL: author ? author.URL : "",
        status: deployment.status(),
        clusterSync: deployment.manifestCommitId === this.state.manifestSync && this.state.manifestSync !== "" ? "Synced" : "",
        endTime: deployment.hldToManifestBuild ? (Number.isNaN(deployment.hldToManifestBuild!.finishTime.valueOf()) ? "-" : deployment.hldToManifestBuild!.finishTime.toLocaleString()) : "-"
      })
    });

    return (<DetailsList
              items={rows}
              columns={columns}
              layoutMode={DetailsListLayoutMode.justified}
              />);
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
                  <td>{deployment.imageTag}</td>
                  <td>{deployment.srcToDockerBuild ? <a href={deployment.srcToDockerBuild.sourceVersionURL}>{deployment.commitId}</a> : "-" }</td>
                  <td>{deployment.srcToDockerBuild ? <a href={deployment.srcToDockerBuild.URL}>{deployment.srcToDockerBuild.id}</a> : "-"}</td>
                  <td>{deployment.srcToDockerBuild ? this.getIcon(deployment.srcToDockerBuild.result) : "-"}</td>
                  <td>{deployment.dockerToHldRelease ? <a href={deployment.dockerToHldRelease.URL}>{deployment.dockerToHldRelease!.id}</a> : "-"}</td>
                  <td>{deployment.environment.toUpperCase()}</td>
                  <td>{deployment.dockerToHldRelease ? this.getIcon(deployment.dockerToHldRelease!.status) : "-"}</td>
                  <td>{deployment.hldToManifestBuild ? <a href={deployment.hldToManifestBuild.sourceVersionURL}>{deployment.hldCommitId}</a> : deployment.hldCommitId}</td>
                  <td>{deployment.hldToManifestBuild ? <a href={deployment.hldToManifestBuild.URL}>{deployment.hldToManifestBuild!.id}</a> : "-"}</td>
                  <td>{deployment.hldToManifestBuild ? this.getIcon(deployment.hldToManifestBuild!.result) : "-"}</td>
                  <td>{deployment.duration()} mins</td>
                  <td>{deployment.status()}</td>
                  <td>{author !== undefined ? <a href={author.URL}>{author.name}</a> : ""}</td>
                  <td>{deployment.manifestCommitId === state.manifestSync && state.manifestSync !== "" ? "Synced" : ""}</td>
                  <td>{deployment.hldToManifestBuild ? (Number.isNaN(deployment.hldToManifestBuild!.finishTime.valueOf()) ? "-" : deployment.hldToManifestBuild!.finishTime.toLocaleString()) : "-"}</td>
                </tr>);
        counter++;
    });
    return (<table>
          <thead>
            <tr>
              <th>Start Time</th>
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
    const srcPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.SRC_PIPELINE_ID, false, config.AZURE_PIPELINE_ACCESS_TOKEN);
    const hldPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.DOCKER_PIPELINE_ID, true, config.AZURE_PIPELINE_ACCESS_TOKEN);
    const clusterPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.HLD_PIPELINE_ID, false, config.AZURE_PIPELINE_ACCESS_TOKEN);

    const manifestRepo: Repository = new GitHub(config.GITHUB_MANIFEST_USERNAME, config.MANIFEST, config.MANIFEST_ACCESS_TOKEN);
    // const manifestRepo: Repository = new AzureDevOpsRepo(config.AZURE_ORG, config.AZURE_PROJECT, config.MANIFEST, config.MANIFEST_ACCESS_TOKEN);
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
