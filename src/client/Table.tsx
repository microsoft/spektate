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

export type RenderFunction = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  tableItem: IDeploymentField
) => JSX.Element;

interface ITableProps {
  clusterSyncAvailable: boolean;
  deploymentRows: IDeploymentField[];
  releasesUrl?: string;
}
let releasesUrl: string = "";
export const Table: React.FC<ITableProps> = (props: ITableProps) => {
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

export const renderSimpleText = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  tableItem: IDeploymentField
): JSX.Element => {
  return (
    <Simple
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      text={tableItem[tableColumn.id]}
    />
  );
};

export const renderTime = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  tableItem: IDeploymentField
): JSX.Element => {
  return (
    <Time
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      deployment={tableItem}
    />
  );
};

export const renderSrcBuild = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  tableItem: IDeploymentField
): JSX.Element => {
  return (
    <Build
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      pipelineResult={tableItem.srcPipelineResult}
      pipelineId={tableItem.srcPipelineId}
      pipelineURL={tableItem.srcPipelineURL}
      commitId={tableItem.srcCommitId}
      commitURL={tableItem.srcCommitURL}
      iconName={"BranchPullRequest"}
    />
  );
};

export const renderHldBuild = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  tableItem: IDeploymentField
): JSX.Element => {
  return (
    <Build
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      pipelineResult={tableItem.hldPipelineResult}
      pipelineId={tableItem.hldPipelineId}
      pipelineURL={tableItem.hldPipelineURL}
      commitId={tableItem.hldCommitId}
      commitURL={tableItem.hldCommitURL}
      iconName={"BranchPullRequest"}
    />
  );
};

export const renderDockerRelease = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  tableItem: IDeploymentField
): JSX.Element => {
  return (
    <Build
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      pipelineResult={tableItem.dockerPipelineResult}
      pipelineId={tableItem.dockerPipelineId}
      pipelineURL={tableItem.dockerPipelineURL}
      commitId={tableItem.imageTag}
      commitURL={""}
      iconName={"Product"}
    />
  );
};

export const renderPR = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  tableItem: IDeploymentField
): JSX.Element => {
  if (tableItem.pr) {
    return (
      <Build
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        pipelineResult={tableItem.mergedByName ? "succeeded" : "waiting"}
        pipelineId={tableItem.pr!.toString()}
        pipelineURL={tableItem.prURL}
        commitId={tableItem.prSourceBranch}
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

export const renderAuthor = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  tableItem: IDeploymentField
): JSX.Element => {
  if (tableItem.authorName && tableItem.authorURL) {
    return (
      <Persona
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        deployment={tableItem}
        name={tableItem.authorName}
        imageUrl={tableItem.authorURL}
      />
    );
  }
  return (
    <SimpleTableCell key={"col-" + columnIndex} columnIndex={columnIndex}>
      -
    </SimpleTableCell>
  );
};

export const renderMergedBy = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  tableItem: IDeploymentField
): JSX.Element => {
  if (tableItem.pr && tableItem.mergedByName) {
    return (
      <Persona
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        deployment={tableItem}
        name={tableItem.mergedByName}
        imageUrl={tableItem.mergedByImageURL}
      />
    );
  }
  return (
    <SimpleTableCell key={"col-" + columnIndex} columnIndex={columnIndex}>
      -
    </SimpleTableCell>
  );
};

export const renderClusters = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  tableItem: IDeploymentField
): JSX.Element => {
  return (
    <Cluster
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      deployment={tableItem}
      releasesUrl={releasesUrl}
    />
  );
};

export const renderDeploymentStatus = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<IDeploymentField>,
  tableItem: IDeploymentField
): JSX.Element => {
  return (
    <Status
      columnIndex={columnIndex}
      tableColumn={tableColumn}
      status={tableItem.status}
    />
  );
};
