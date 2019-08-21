
import { Ago } from "azure-devops-ui/Ago";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Duration } from "azure-devops-ui/Duration";
// import { Icon } from 'office-ui-fabric-react/lib/Icon';
import { Icon, IIconProps } from "azure-devops-ui/Icon";
import { Link } from "azure-devops-ui/Link";
import { IStatusProps, Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import { ColumnFill, ITableColumn, SimpleTableCell, Table, TwoLineTableCell } from 'azure-devops-ui/Table';
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
// import { DetailsList, DetailsListLayoutMode, IColumn, SelectionMode } from 'office-ui-fabric-react/lib/DetailsList';
import * as React from 'react';
import { config } from "./config";
import './css/dashboard.css';
import Deployment from "./models/Deployment";
import AzureDevOpsPipeline from "./models/pipeline/AzureDevOpsPipeline";
import { Author } from './models/repository/Author';
import { GitHub } from './models/repository/GitHub';
import { Repository } from './models/repository/Repository';
import { Tag } from './models/repository/Tag';


interface IStatusIndicatorData {
  statusProps: IStatusProps;
  label: string;
}
export interface IAuthors {
  [commitId: string]: Author;
}
export interface IDashboardState{
  deployments: Deployment[],
  manifestSync?: Tag,
  authors: IAuthors
}
export interface IDeploymentField {
  startTime?: Date;
  imageTag?: string;
  srcCommitId?: string;
  srcBranchName?: string;
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
  clusterSyncDate?: string;
  endTime?: Date;
  authorName?: string;
  authorURL?: string;
}
class Dashboard extends React.Component<{}, IDashboardState> {
  constructor(props:{}) {
    super(props);
    this.state = {
      authors: {},
      deployments: []
    };
      this.getDeployments();
  }
  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Bedrock Deployment Observability</h1>
        </header>
        {this.renderPrototypeTable()}
      </div>
    );
  }

  public renderPrototypeTable = () => {

    const columns: Array<ITableColumn<IDeploymentField>> = [
      { id: 'status', name: 'State', width: new ObservableValue(70), renderCell: this.renderDeploymentStatus},      
      // { id: 'imageTag', name: 'Image Tag', width: new ObservableValue(220), renderCell: this.renderSimpleText},     
      { id: 'srcBranchName', name: 'Branch', width: new ObservableValue(180), renderCell: this.renderSimpleText}, 
      { id: 'environment', name: 'Environment', width: new ObservableValue(100), renderCell: this.renderSimpleText},
      { id: 'srcPipelineId', name: 'SRC to ACR', width: new ObservableValue(200), renderCell: this.renderSrcBuild},
      { id: 'dockerPipelineId', name: 'ACR to HLD', width: new ObservableValue(250), renderCell: this.renderDockerRelease},
      { id: 'hldPipelineId', name: 'HLD to Manifest', width: new ObservableValue(200), renderCell: this.renderHldBuild},
      { id: 'authorName', name: 'Author', width: new ObservableValue(80), renderCell: this.renderSimpleBoldText},
      { id: 'clusterSync', name: 'Cluster-Sync', width: new ObservableValue(120), renderCell: this.renderClusterSync},
      { id: 'deployedAt', name: 'Deployed at', width: new ObservableValue(180),renderCell: this.renderTime},
      ColumnFill
    ];

    // tslint:disable-next-line: prefer-const
    let rows: IDeploymentField[] = [];
    this.state.deployments.forEach((deployment) => {
      const author = this.getAuthor(deployment);
      rows.push({
        startTime: deployment.srcToDockerBuild ? deployment.srcToDockerBuild.startTime : new Date(),
        // tslint:disable-next-line: object-literal-sort-keys
        imageTag: deployment.imageTag,
        srcCommitId: deployment.commitId,
        srcBranchName: deployment.srcToDockerBuild ? deployment.srcToDockerBuild.sourceBranch : "",
        srcCommitURL: deployment.srcToDockerBuild ? deployment.srcToDockerBuild.sourceVersionURL : "",
        srcPipelineId: deployment.srcToDockerBuild ? deployment.srcToDockerBuild.buildNumber : "",
        srcPipelineURL: deployment.srcToDockerBuild ? deployment.srcToDockerBuild.URL : "",
        srcPipelineResult: deployment.srcToDockerBuild ? deployment.srcToDockerBuild.result : "-",
        dockerPipelineId: deployment.dockerToHldRelease ? deployment.dockerToHldRelease.releaseName : "",
        dockerPipelineURL: deployment.dockerToHldRelease ? deployment.dockerToHldRelease.URL : "",
        environment: deployment.environment.toUpperCase(),
        dockerPipelineResult: deployment.dockerToHldRelease ? deployment.dockerToHldRelease.status : "-",
        hldCommitId: deployment.hldCommitId,
        hldCommitURL: deployment.hldToManifestBuild ? deployment.hldToManifestBuild.sourceVersionURL : "",
        hldPipelineId: deployment.hldToManifestBuild ? deployment.hldToManifestBuild.buildNumber : "",
        hldPipelineResult: deployment.hldToManifestBuild ? deployment.hldToManifestBuild.result : "-",
        hldPipelineURL: deployment.hldToManifestBuild ? deployment.hldToManifestBuild.URL : "",
        duration: deployment.duration() + " mins",
        authorName: author ? author.name : "",
        authorURL: author ? author.URL : "",
        status: deployment.status(),
        clusterSync: this.state.manifestSync && deployment.manifestCommitId === this.state.manifestSync.commit && this.state.manifestSync.commit !== "" ? "Synced" : "",
        clusterSyncDate: this.state.manifestSync && deployment.manifestCommitId === this.state.manifestSync.commit && this.state.manifestSync.commit !== "" ? this.state.manifestSync.date.toString() : "",
        endTime: deployment.hldToManifestBuild ? (Number.isNaN(deployment.hldToManifestBuild!.finishTime.valueOf()) ? new Date() : deployment.hldToManifestBuild!.finishTime) : new Date()
      })
    });
    return (
      <Table columns={columns} pageSize={rows.length} role="table" itemProvider={new ArrayItemProvider<IDeploymentField>(rows)} showLines={true} />
    );
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

  private renderClusterSync = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IDeploymentField>, tableItem: IDeploymentField): JSX.Element => {
    if (tableItem.clusterSyncDate !== "") {
      return (
        <TwoLineTableCell
          key={"col-" + columnIndex}
          columnIndex={columnIndex}
          tableColumn={tableColumn}
          line1={this.WithIcon({
            children: (
                tableItem.clusterSync!
            ),
            className: "fontSize font-size",
            iconProps: { iconName: "CloudDownload" }
        })}
          line2={this.WithIcon({
            children: (
                <Ago date={new Date(tableItem.clusterSyncDate!)} />
            ),
            className: "fontSize font-size",
            iconProps: { iconName: "Calendar" }
        })}
      />
      );
    }
    return <SimpleTableCell columnIndex={columnIndex}/>;
  } 

  private renderSimpleText = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IDeploymentField>, tableItem: IDeploymentField): JSX.Element => {
    return (
      <SimpleTableCell
        columnIndex={columnIndex}
          tableColumn={tableColumn}
          key={"col-" + columnIndex}
          contentClassName="fontSizeM font-size-m scroll-hidden"
      >
        <div className="flex-row scroll-hidden">
                <Tooltip overflowOnly={true}>
                    <span className="text-ellipsis">{tableItem[tableColumn.id]}</span>
                </Tooltip>
            </div>
      </SimpleTableCell>
    )
  }

  private renderSimpleBoldText = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IDeploymentField>, tableItem: IDeploymentField): JSX.Element => {
    return (
      <SimpleTableCell
        columnIndex={columnIndex}
          tableColumn={tableColumn}
          key={"col-" + columnIndex}
          contentClassName="fontWeightSemiBold font-weight-semibold fontSizeM font-size-m scroll-hidden"
      >
        <div className="flex-row scroll-hidden">
                <Tooltip overflowOnly={true}>
                    <span className="text-ellipsis">{tableItem[tableColumn.id]}</span>
                </Tooltip>
            </div>
      </SimpleTableCell>
    )
  }

  private renderTime = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IDeploymentField>, tableItem: IDeploymentField): JSX.Element => {
    return (
      <TwoLineTableCell
        key={"col-" + columnIndex}
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        line1={this.WithIcon({
            children: (
                <Ago date={tableItem.endTime!} />
            ),
            className: "fontSize font-size",
            iconProps: { iconName: "Calendar" }
        })}
        line2={this.WithIcon({
            children: (
                <Duration
                    startDate={tableItem.startTime!}
                    endDate={tableItem.endTime!}
                />
            ),
            className: "fontSize font-size bolt-table-two-line-cell-item",
            iconProps: { iconName: "Clock" },
        })}
    />
    );
  }

  private renderSrcBuild = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IDeploymentField>, tableItem: IDeploymentField): JSX.Element => {
      return this.renderBuild(rowIndex, columnIndex, tableColumn, tableItem.srcPipelineResult, "#" + tableItem.srcPipelineId, tableItem.srcPipelineURL, tableItem.srcCommitId, tableItem.srcCommitURL, "BranchPullRequest");
  }

  private renderHldBuild = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IDeploymentField>, tableItem: IDeploymentField): JSX.Element => {
      return this.renderBuild(rowIndex, columnIndex, tableColumn, tableItem.hldPipelineResult, "#" + tableItem.hldPipelineId, tableItem.hldPipelineURL, tableItem.hldCommitId, tableItem.hldCommitURL, "BranchPullRequest");
  }

  private renderDockerRelease = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IDeploymentField>, tableItem: IDeploymentField): JSX.Element => {
      return this.renderBuild(rowIndex, columnIndex, tableColumn, tableItem.dockerPipelineResult, tableItem.dockerPipelineId, tableItem.dockerPipelineURL, tableItem.imageTag, "", "Product");
  }

  private renderBuild = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IDeploymentField>, pipelineResult?: string, pipelineId?: string, pipelineURL?: string, commitId?: string, commitURL?: string, iconName?: string): JSX.Element => {
    const commitCell = this.WithIcon({
      className: "", 
      iconProps: { iconName }, 

      children: (
        <div>{commitId}</div>
      )
    });
    return (
        <TwoLineTableCell
            className="first-row no-cell-top-border bolt-table-cell-content-with-inline-link no-v-padding"
            key={'col-' + columnIndex}
            columnIndex={columnIndex}
            tableColumn={tableColumn}
            iconProps={this.getIcon(pipelineResult)}
            line1={
                    <Tooltip text={pipelineId} overflowOnly={true}>
                        {pipelineURL && (<Link
                            className="fontSizeM font-size-m text-ellipsis bolt-table-link bolt-table-inline-link"
                            href={pipelineURL}
                            // tslint:disable-next-line: jsx-no-lambda
                            onClick={() => (parent.window.location.href = pipelineURL)}
                        >
                            {pipelineId}
                        </Link>)}
                    </Tooltip>
            }
            line2={
                <Tooltip overflowOnly={true}>
                    <span className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
                    {
                      commitId && (commitURL && commitURL !== "" && <Link
                        className="monospaced-text text-ellipsis flex-row flex-center bolt-table-link bolt-table-inline-link"
                        href={commitURL}
                        // tslint:disable-next-line: jsx-no-lambda
                        onClick={() => (parent.window.location.href = commitURL)}
                        >
                          {commitCell}
                      </Link>
                    )}
                    { commitId && commitURL === "" && commitCell }
                    </span>
                </Tooltip>
            }
        />
    );
  }

  private renderDeploymentStatus = (rowIndex: number, columnIndex: number, tableColumn: ITableColumn<IDeploymentField>, tableItem: IDeploymentField): JSX.Element => {
    console.log(tableItem.status);
    return (
      <SimpleTableCell
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        key={"col-" + columnIndex}
        contentClassName="fontWeightSemiBold font-weight-semibold fontSizeM font-size-m scroll-hidden"
      >
        
        <Status
                {...this.getStatusIndicatorData(tableItem.status).statusProps}
                className="icon-large-margin"
                size={StatusSize.l}
            />
      </SimpleTableCell>
    )
  }

  private WithIcon = (props: {
      className?: string;
      iconProps: IIconProps;
      children?: React.ReactNode;
  }) => {
      return (
          <div className="flex-row flex-center">
              {Icon({ ...props.iconProps, className: "icon-margin" })}
              {props.children}
          </div>
      );
  }

  private getStatusIndicatorData = (status: string): IStatusIndicatorData => {
    status = status || "";
    status = status.toLowerCase();
    console.log(status);
    const indicatorData: IStatusIndicatorData = {
        label: "Success",
        statusProps: { ...Statuses.Success, ariaLabel: "Success" }
    };
    switch (status.toLowerCase()) {
        case "failed":
            indicatorData.statusProps = { ...Statuses.Failed, ariaLabel: "Failed" };
            indicatorData.label = "Failed";
            break;
        case "in progress":
            indicatorData.statusProps = { ...Statuses.Running, ariaLabel: "Running" };
            indicatorData.label = "Running";
            break;
        case "warning":
            indicatorData.statusProps = { ...Statuses.Warning, ariaLabel: "Warning" };
            indicatorData.label = "Warning";

            break;
    }

    return indicatorData;
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

  private getIcon(status?: string): IIconProps {
    if(status === "succeeded") {
      return {iconName: "SkypeCircleCheck", style: {color: "green"}};
    } else if (status === undefined || status === "inProgress") {
      return {iconName: "Clock", style: {color: "blue"}}; // SyncStatusSolid
    }
    return {iconName: "SkypeCircleMinus", style: {color: "red"}};
  }
}

export default Dashboard;
