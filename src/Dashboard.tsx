import { Ago } from "azure-devops-ui/Ago";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Duration } from "azure-devops-ui/Duration";
import { Icon, IIconProps } from "azure-devops-ui/Icon";
import { Link } from "azure-devops-ui/Link";
import { Status, Statuses, StatusSize } from "azure-devops-ui/Status";
import {
  ColumnFill,
  ITableColumn,
  SimpleTableCell,
  Table,
  TwoLineTableCell
} from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import Deployment from "spektate/lib/Deployment";
import AzureDevOpsPipeline from "spektate/lib/pipeline/AzureDevOpsPipeline";
import { IAuthor } from "spektate/lib/repository/Author";
import { GitHub } from "spektate/lib/repository/GitHub";
import { IRepository } from "spektate/lib/repository/Repository";
import { config } from "./config";
import "./css/dashboard.css";
import {
  IDashboardState,
  IDeploymentField,
  IStatusIndicatorData
} from "./Dashboard.types";

const REFRESH_INTERVAL = 30000;
class Dashboard<Props> extends React.Component<Props, IDashboardState> {
  private interval: NodeJS.Timeout;
  constructor(props: Props) {
    super(props);
    this.state = {
      authors: {},
      deployments: []
    };
  }

  public componentDidMount() {
    this.interval = setInterval(this.updateDeployments, REFRESH_INTERVAL);
    this.updateDeployments();
  }

  public componentWillUnmount() {
    clearInterval(this.interval);
  }

  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Spektate</h1>
        </header>
        {this.renderPrototypeTable()}
      </div>
    );
  }

  private updateDeployments = () => {
    if (
      !config.AZURE_ORG ||
      !config.AZURE_PROJECT ||
      !config.STORAGE_ACCOUNT_NAME ||
      !config.STORAGE_ACCOUNT_KEY ||
      !config.STORAGE_TABLE_NAME ||
      !config.STORAGE_PARTITION_KEY
    ) {
      return;
    }
    const srcPipeline = new AzureDevOpsPipeline(
      config.AZURE_ORG,
      config.AZURE_PROJECT,
      false,
      config.AZURE_PIPELINE_ACCESS_TOKEN,
      config.SOURCE_REPO_ACCESS_TOKEN
    );
    const hldPipeline = new AzureDevOpsPipeline(
      config.AZURE_ORG,
      config.AZURE_PROJECT,
      true,
      config.AZURE_PIPELINE_ACCESS_TOKEN
    );
    const clusterPipeline = new AzureDevOpsPipeline(
      config.AZURE_ORG,
      config.AZURE_PROJECT,
      false,
      config.AZURE_PIPELINE_ACCESS_TOKEN
    );
    if (config.MANIFEST && config.GITHUB_MANIFEST_USERNAME) {
      const manifestRepo: IRepository = new GitHub(
        config.GITHUB_MANIFEST_USERNAME,
        config.MANIFEST,
        config.MANIFEST_ACCESS_TOKEN
      );
      // const manifestRepo: Repository = new AzureDevOpsRepo(config.AZURE_ORG, config.AZURE_PROJECT, config.MANIFEST, config.MANIFEST_ACCESS_TOKEN);
      manifestRepo.getManifestSyncState().then((syncCommit: any) => {
        this.setState({ manifestSync: syncCommit });
      });
    }
    Deployment.getDeployments(
      config.STORAGE_ACCOUNT_NAME,
      config.STORAGE_ACCOUNT_KEY,
      config.STORAGE_TABLE_NAME,
      config.STORAGE_PARTITION_KEY,
      srcPipeline,
      hldPipeline,
      clusterPipeline,
      undefined
    ).then((deployments: Deployment[]) => {
      this.setState({ deployments });
      this.getAuthors();
    });
    return <div />;
  };

  private renderPrototypeTable = () => {
    const columns: Array<ITableColumn<IDeploymentField>> = [
      {
        id: "status",
        name: "State",
        renderCell: this.renderDeploymentStatus,
        width: new ObservableValue(70)
      },
      {
        id: "deploymentId",
        name: "Deployment ID",
        renderCell: this.renderDeploymentId,
        width: new ObservableValue(140)
      },
      {
        id: "service",
        name: "Service",
        renderCell: this.renderSimpleText,
        width: new ObservableValue(200)
      },
      {
        id: "srcBranchName",
        name: "Branch",
        renderCell: this.renderSimpleText,
        width: new ObservableValue(180)
      },
      {
        id: "environment",
        name: "Environment",
        renderCell: this.renderSimpleText,
        width: new ObservableValue(100)
      },
      {
        id: "srcPipelineId",
        name: "SRC to ACR",
        renderCell: this.renderSrcBuild,
        width: new ObservableValue(200)
      },
      {
        id: "dockerPipelineId",
        name: "ACR to HLD",
        renderCell: this.renderDockerRelease,
        width: new ObservableValue(250)
      },
      {
        id: "hldPipelineId",
        name: "HLD to Manifest",
        renderCell: this.renderHldBuild,
        width: new ObservableValue(200)
      },
      {
        id: "authorName",
        name: "Author",
        renderCell: this.renderSimpleBoldText,
        width: new ObservableValue(200)
      },
      {
        id: "deployedAt",
        name: "Deployed at",
        renderCell: this.renderTime,
        width: new ObservableValue(180)
      },
      ColumnFill
    ];
    let rows: IDeploymentField[] = [];
    try {
      rows = this.state.deployments.map(deployment => {
        const author = this.getAuthor(deployment);
        return {
          deploymentId: deployment.deploymentId,
          service: deployment.service,
          startTime: deployment.srcToDockerBuild
            ? deployment.srcToDockerBuild.startTime
            : new Date(),
          // tslint:disable-next-line: object-literal-sort-keys
          imageTag: deployment.imageTag,
          srcCommitId: deployment.commitId,
          srcBranchName: deployment.srcToDockerBuild
            ? deployment.srcToDockerBuild.sourceBranch
            : "",
          srcCommitURL: deployment.srcToDockerBuild
            ? deployment.srcToDockerBuild.sourceVersionURL
            : "",
          srcPipelineId: deployment.srcToDockerBuild
            ? deployment.srcToDockerBuild.buildNumber
            : "",
          srcPipelineURL: deployment.srcToDockerBuild
            ? deployment.srcToDockerBuild.URL
            : "",
          srcPipelineResult: deployment.srcToDockerBuild
            ? deployment.srcToDockerBuild.result
            : "-",
          dockerPipelineId: deployment.dockerToHldRelease
            ? deployment.dockerToHldRelease.releaseName
            : deployment.dockerToHldReleaseStage
            ? deployment.dockerToHldReleaseStage.buildNumber
            : "",
          dockerPipelineURL: deployment.dockerToHldRelease
            ? deployment.dockerToHldRelease.URL
            : deployment.dockerToHldReleaseStage
            ? deployment.dockerToHldReleaseStage.URL
            : "",
          environment: deployment.environment.toUpperCase(),
          dockerPipelineResult: deployment.dockerToHldRelease
            ? deployment.dockerToHldRelease.status
            : deployment.dockerToHldReleaseStage
            ? deployment.dockerToHldReleaseStage.result
            : "",
          hldCommitId: deployment.hldCommitId,
          hldCommitURL: deployment.hldToManifestBuild
            ? deployment.hldToManifestBuild.sourceVersionURL
            : "",
          hldPipelineId: deployment.hldToManifestBuild
            ? deployment.hldToManifestBuild.buildNumber
            : "",
          hldPipelineResult: deployment.hldToManifestBuild
            ? deployment.hldToManifestBuild.result
            : "-",
          hldPipelineURL: deployment.hldToManifestBuild
            ? deployment.hldToManifestBuild.URL
            : "",
          duration: deployment.duration() + " mins",
          authorName: author ? author.name : "",
          authorURL: author ? author.url : "",
          status: deployment.status(),
          clusterSync:
            this.state.manifestSync &&
            deployment.manifestCommitId === this.state.manifestSync.commit &&
            this.state.manifestSync.commit !== "",
          clusterSyncDate:
            this.state.manifestSync &&
            deployment.manifestCommitId === this.state.manifestSync.commit &&
            this.state.manifestSync.commit !== ""
              ? this.state.manifestSync.date
              : new Date(),
          endTime: deployment.endTime()
        };
      });
    } catch (err) {
      console.error(err);
    }
    return (
      <div className="PrototypeTable">
        <Table
          columns={columns}
          pageSize={rows.length}
          role="table"
          itemProvider={new ArrayItemProvider<IDeploymentField>(rows)}
          showLines={true}
        />
      </div>
    );
  };

  private renderSimpleText = (
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<IDeploymentField>,
    tableItem: IDeploymentField
  ): JSX.Element => {
    if (!tableItem[tableColumn.id]) {
      return (
        <SimpleTableCell key={"col-" + columnIndex} columnIndex={columnIndex} />
      );
    }
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
    );
  };

  private renderDeploymentId = (
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<IDeploymentField>,
    tableItem: IDeploymentField
  ): JSX.Element => {
    if (!tableItem[tableColumn.id]) {
      return (
        <SimpleTableCell key={"col-" + columnIndex} columnIndex={columnIndex} />
      );
    }
    return (
      <SimpleTableCell
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        key={"col-" + columnIndex}
        contentClassName="monospaced-text fontSize font-size scroll-hidden"
      >
        <div className="flex-row scroll-hidden">
          <Tooltip overflowOnly={true}>
            <span className="text-ellipsis">{tableItem[tableColumn.id]}</span>
          </Tooltip>
        </div>
      </SimpleTableCell>
    );
  };

  private renderSimpleBoldText = (
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<IDeploymentField>,
    tableItem: IDeploymentField
  ): JSX.Element => {
    if (!tableItem[tableColumn.id]) {
      return (
        <SimpleTableCell key={"col-" + columnIndex} columnIndex={columnIndex} />
      );
    }
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
    );
  };

  private renderTime = (
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<IDeploymentField>,
    tableItem: IDeploymentField
  ): JSX.Element => {
    if (!tableItem.startTime || !tableItem.endTime) {
      return (
        <SimpleTableCell key={"col-" + columnIndex} columnIndex={columnIndex} />
      );
    }
    return (
      <TwoLineTableCell
        key={"col-" + columnIndex}
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        line1={this.WithIcon({
          children: <Ago date={tableItem.endTime!} />,
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
          iconProps: { iconName: "Clock" }
        })}
      />
    );
  };

  private renderSrcBuild = (
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<IDeploymentField>,
    tableItem: IDeploymentField
  ): JSX.Element => {
    return this.renderBuild(
      rowIndex,
      columnIndex,
      tableColumn,
      tableItem,
      tableItem.srcPipelineResult,
      "#" + tableItem.srcPipelineId,
      tableItem.srcPipelineURL,
      tableItem.srcCommitId,
      tableItem.srcCommitURL,
      "BranchPullRequest"
    );
  };

  private renderHldBuild = (
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<IDeploymentField>,
    tableItem: IDeploymentField
  ): JSX.Element => {
    return this.renderBuild(
      rowIndex,
      columnIndex,
      tableColumn,
      tableItem,
      tableItem.hldPipelineResult,
      "#" + tableItem.hldPipelineId,
      tableItem.hldPipelineURL,
      tableItem.hldCommitId,
      tableItem.hldCommitURL,
      "BranchPullRequest"
    );
  };

  private renderDockerRelease = (
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<IDeploymentField>,
    tableItem: IDeploymentField
  ): JSX.Element => {
    return this.renderBuild(
      rowIndex,
      columnIndex,
      tableColumn,
      tableItem,
      tableItem.dockerPipelineResult,
      tableItem.dockerPipelineId,
      tableItem.dockerPipelineURL,
      tableItem.imageTag,
      "",
      "Product"
    );
  };

  private renderBuild = (
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<IDeploymentField>,
    tableItem: IDeploymentField,
    pipelineResult?: string,
    pipelineId?: string,
    pipelineURL?: string,
    commitId?: string,
    commitURL?: string,
    iconName?: string
  ): JSX.Element => {
    if (!pipelineId || !pipelineURL || !commitId) {
      return (
        <SimpleTableCell key={"col-" + columnIndex} columnIndex={columnIndex} />
      );
    }
    const commitCell = this.WithIcon({
      className: "",
      iconProps: { iconName },

      children: <div>{commitId}</div>
    });
    return (
      <TwoLineTableCell
        className="first-row no-cell-top-border bolt-table-cell-content-with-inline-link no-v-padding"
        key={"col-" + columnIndex}
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        iconProps={this.getIcon(pipelineResult)}
        line1={
          <Tooltip text={pipelineId} overflowOnly={true}>
            {pipelineURL && (
              <Link
                className="fontSizeM font-size-m text-ellipsis bolt-table-link bolt-table-inline-link"
                href={pipelineURL}
                // tslint:disable-next-line: jsx-no-lambda
                onClick={() => (parent.window.location.href = pipelineURL)}
              >
                {pipelineId}
              </Link>
            )}
          </Tooltip>
        }
        line2={
          <Tooltip overflowOnly={true}>
            <span className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
              {commitId &&
                (commitURL && commitURL !== "" && (
                  <Link
                    className="monospaced-text text-ellipsis flex-row flex-center bolt-table-link bolt-table-inline-link"
                    href={commitURL}
                    // tslint:disable-next-line: jsx-no-lambda
                    onClick={() => (parent.window.location.href = commitURL)}
                  >
                    {commitCell}
                  </Link>
                ))}
              {commitId && commitURL === "" && commitCell}
            </span>
          </Tooltip>
        }
      />
    );
  };

  private renderDeploymentStatus = (
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<IDeploymentField>,
    tableItem: IDeploymentField
  ): JSX.Element => {
    if (!tableItem.status) {
      return (
        <SimpleTableCell key={"col-" + columnIndex} columnIndex={columnIndex} />
      );
    }
    return (
      <SimpleTableCell
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        key={"col-" + columnIndex}
        contentClassName="fontWeightSemiBold font-weight-semibold fontSizeM font-size-m scroll-hidden"
      >
        <Status
          {...this.getStatusIndicatorData(
            tableItem.status,
            tableItem.clusterSync
          ).statusProps}
          className="icon-large-margin"
          size={StatusSize.l}
        />
        {tableItem.clusterSync && (
          <Tooltip
            overflowOnly={false}
            text={"Synced at " + tableItem.clusterSyncDate!.toLocaleString()}
          >
            {this.WithIcon({
              className: "fontSizeM font-size-m",
              iconProps: { iconName: "CloudUpload" }
            })}
          </Tooltip>
        )}
      </SimpleTableCell>
    );
  };

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
  };

  private getStatusIndicatorData = (
    status: string,
    clusterSync?: boolean
  ): IStatusIndicatorData => {
    status = status || "";
    status = status.toLowerCase();
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
        indicatorData.statusProps = {
          ...Statuses.Running,
          ariaLabel: "Running"
        };
        indicatorData.label = "Running";
        break;
      case "incomplete":
        indicatorData.statusProps = {
          ...Statuses.Warning,
          ariaLabel: "Incomplete"
        };
        indicatorData.label = "Incomplete";

        break;
    }

    return indicatorData;
  };

  private getAuthors = () => {
    const state = this.state;
    this.state.deployments.forEach(deployment => {
      if (
        deployment.srcToDockerBuild &&
        !(deployment.srcToDockerBuild.sourceVersion in state.authors)
      ) {
        try {
          deployment.fetchAuthor((author: IAuthor) => {
            if (author && deployment.srcToDockerBuild) {
              const copy = state.authors;
              copy[deployment.srcToDockerBuild.sourceVersion] = author;
              this.setState({ authors: copy });
            }
          });
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  private getAuthor = (deployment: Deployment): IAuthor | undefined => {
    if (
      deployment.srcToDockerBuild &&
      deployment.srcToDockerBuild.sourceVersion in this.state.authors
    ) {
      return this.state.authors[deployment.srcToDockerBuild.sourceVersion];
    }
    return undefined;
  };

  private getIcon(status?: string): IIconProps {
    if (status === "succeeded") {
      return { iconName: "SkypeCircleCheck", style: { color: "green" } };
    } else if (status === undefined || status === "inProgress") {
      return { iconName: "ProgressRingDots", style: { color: "blue" } }; // SyncStatusSolid
    }
    return { iconName: "SkypeCircleMinus", style: { color: "red" } };
  }
}

export default Dashboard;
