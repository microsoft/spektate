import { ObservableValue } from "azure-devops-ui/Core/Observable";
import {
  ColumnFill,
  ITableColumn,
  SimpleTableCell,
  Table as AzureTable
} from "azure-devops-ui/Table";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
import * as React from "react";
import { Build } from "./cells/build";
import { Cluster } from "./cells/cluster";
import { Persona } from "./cells/persona";
import { Simple } from "./cells/simple";
import { Status } from "./cells/status";
import { Time } from "./cells/time";
import { IDeploymentField } from "./Dashboard.types";

/**
 * Render function type based on cells in azure-devops-ui table
 */
export type RenderFunction = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  deployment: IDeploymentField
) => JSX.Element;

/**
 * Interface for table props
 */
interface ITableProps {
  clusterSyncAvailable: boolean;
  deploymentRows: IDeploymentField[];
  releasesUrl?: string;
}

let releasesUrl: string = "";
export const DeploymentTable: React.FC<ITableProps> = (props: ITableProps) => {
  const columns: Array<ITableColumn<IDeploymentField>> = [
    {
      id: "status",
      name: "State",
      renderCell: renderDeploymentStatus,
      width: new ObservableValue(70)
    },
    {
      id: "service",
      name: "Service",
      renderCell: renderSimpleText,
      width: new ObservableValue(180)
    },
    {
      id: "environment",
      name: "Ring",
      renderCell: renderSimpleText,
      width: new ObservableValue(220)
    },
    {
      id: "authorName",
      name: "Author",
      renderCell: renderAuthor,
      width: new ObservableValue(200)
    },
    {
      id: "srcPipelineId",
      name: "SRC to ACR",
      renderCell: renderSrcBuild,
      width: new ObservableValue(200)
    },
    {
      id: "dockerPipelineId",
      name: "ACR to HLD",
      renderCell: renderDockerRelease,
      width: new ObservableValue(250)
    },
    {
      id: "pr",
      name: "Approval Pull Request",
      renderCell: renderPR,
      width: new ObservableValue(250)
    },
    {
      id: "mergedByName",
      name: "Merged By",
      renderCell: renderMergedBy,
      width: new ObservableValue(200)
    },
    {
      id: "hldPipelineId",
      name: "HLD to Manifest",
      renderCell: renderHldBuild,
      width: new ObservableValue(200)
    },
    {
      id: "deployedAt",
      name: "Last Updated",
      renderCell: renderTime,
      width: new ObservableValue(120)
    }
  ];
  if (props.releasesUrl) {
    releasesUrl = props.releasesUrl;
  }
  // Display the cluster column only if there is information to show in the table
  if (props.clusterSyncAvailable) {
    columns.push({
      id: "clusterName",
      name: "Synced Cluster",
      renderCell: renderClusters,
      width: new ObservableValue(200)
    });
  }
  columns.push(ColumnFill);
  return (
    <div className="PrototypeTable">
      <AzureTable
        columns={columns}
        pageSize={props.deploymentRows.length}
        role="table"
        itemProvider={
          new ArrayItemProvider<IDeploymentField>(props.deploymentRows)
        }
        showLines={true}
      />
    </div>
  );
};

/**
 * Renders simple text cell
 * @param rowIndex row index
 * @param columnIndex column index
 * @param tableColumn table column
 * @param deployment deployment being displayed
 */
export const renderSimpleText = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  deployment: IDeploymentField
): JSX.Element => {
  return (
    <Simple
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      text={deployment[tableColumn.id]}
    />
  );
};

/**
 * Renders time cell
 * @param rowIndex row index
 * @param columnIndex column index
 * @param tableColumn table column
 * @param deployment deployment being displayed
 */
export const renderTime = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  deployment: IDeploymentField
): JSX.Element => {
  return (
    <Time
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      deployment={deployment}
    />
  );
};

/**
 * Renders source to acr build cell
 * @param rowIndex row index
 * @param columnIndex column index
 * @param tableColumn table column
 * @param deployment deployment being displayed
 */
export const renderSrcBuild = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  deployment: IDeploymentField
): JSX.Element => {
  return (
    <Build
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      pipelineResult={deployment.srcPipelineResult}
      pipelineId={deployment.srcPipelineId}
      pipelineURL={deployment.srcPipelineURL}
      commitId={deployment.srcCommitId}
      commitURL={deployment.srcCommitURL}
      iconName={"BranchPullRequest"}
    />
  );
};

/**
 * Renders hld to manifest build cell
 * @param rowIndex row index
 * @param columnIndex column index
 * @param tableColumn table column
 * @param deployment deployment being displayed
 */
export const renderHldBuild = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  deployment: IDeploymentField
): JSX.Element => {
  return (
    <Build
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      pipelineResult={deployment.hldPipelineResult}
      pipelineId={deployment.hldPipelineId}
      pipelineURL={deployment.hldPipelineURL}
      commitId={deployment.hldCommitId}
      commitURL={deployment.hldCommitURL}
      iconName={"BranchPullRequest"}
    />
  );
};

/**
 * Renders acr to hld cell
 * @param rowIndex row index
 * @param columnIndex column index
 * @param tableColumn table column
 * @param deployment deployment being displayed
 */
export const renderDockerRelease = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  deployment: IDeploymentField
): JSX.Element => {
  return (
    <Build
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      pipelineResult={deployment.dockerPipelineResult}
      pipelineId={deployment.dockerPipelineId}
      pipelineURL={deployment.dockerPipelineURL}
      commitId={deployment.imageTag}
      commitURL={""}
      iconName={"Product"}
    />
  );
};

/**
 * Renders PR cell
 * @param rowIndex row index
 * @param columnIndex column index
 * @param tableColumn table column
 * @param deployment deployment being displayed
 */
export const renderPR = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  deployment: IDeploymentField
): JSX.Element => {
  if (deployment.pr) {
    return (
      <Build
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        pipelineResult={deployment.mergedByName ? "succeeded" : "waiting"}
        pipelineId={deployment.pr!.toString()}
        pipelineURL={deployment.prURL}
        commitId={deployment.prSourceBranch}
        commitURL={""}
        iconName={"BranchPullRequest"}
      />
    );
  } else {
    return (
      <SimpleTableCell key={"col-" + columnIndex} columnIndex={columnIndex}>
        -
      </SimpleTableCell>
    );
  }
};

/**
 * Renders author cell
 * @param rowIndex row index
 * @param columnIndex column index
 * @param tableColumn table column
 * @param deployment deployment being displayed
 */
export const renderAuthor = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  deployment: IDeploymentField
): JSX.Element => {
  if (deployment.authorName && deployment.authorURL) {
    return (
      <Persona
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        deployment={deployment}
        name={deployment.authorName}
        imageUrl={deployment.authorURL}
      />
    );
  }
  return (
    <SimpleTableCell key={"col-" + columnIndex} columnIndex={columnIndex}>
      -
    </SimpleTableCell>
  );
};

/**
 * Renders merged by author cell
 * @param rowIndex row index
 * @param columnIndex column index
 * @param tableColumn table column
 * @param deployment deployment being displayed
 */
export const renderMergedBy = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  deployment: IDeploymentField
): JSX.Element => {
  if (deployment.pr && deployment.mergedByName) {
    return (
      <Persona
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        deployment={deployment}
        name={deployment.mergedByName}
        imageUrl={deployment.mergedByImageURL}
      />
    );
  }
  return (
    <SimpleTableCell key={"col-" + columnIndex} columnIndex={columnIndex}>
      -
    </SimpleTableCell>
  );
};

/**
 * Renders clusters cell
 * @param rowIndex row index
 * @param columnIndex column index
 * @param tableColumn table column
 * @param deployment deployment being displayed
 */
export const renderClusters = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  deployment: IDeploymentField
): JSX.Element => {
  return (
    <Cluster
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      deployment={deployment}
      releasesUrl={releasesUrl}
    />
  );
};

/**
 * Renders deployment status cell
 * @param rowIndex row index
 * @param columnIndex column index
 * @param tableColumn table column
 * @param deployment deployment being displayed
 */
export const renderDeploymentStatus = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  deployment: IDeploymentField
): JSX.Element => {
  return (
    <Status
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      status={deployment.status}
    />
  );
};
