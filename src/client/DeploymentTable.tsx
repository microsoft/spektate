import {
  ObservableArray,
  ObservableValue
} from "azure-devops-ui/Core/Observable";
import {
  ColumnFill,
  ColumnSorting,
  ITableColumn,
  SimpleTableCell,
  sortItems,
  SortOrder,
  Table as AzureTable
} from "azure-devops-ui/Table";
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
let tableItems: ObservableArray<IDeploymentField>;
let rawTableItems: IDeploymentField[];
let columns: Array<ITableColumn<IDeploymentField>>;
let sortFunctions: Array<
  ((item1: IDeploymentField, item2: IDeploymentField) => number) | null
>;

const sortingBehavior = new ColumnSorting<IDeploymentField>(
  (
    columnIndex: number,
    proposedSortOrder: SortOrder,
    event: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement>
  ) => {
    tableItems.splice(
      0,
      tableItems.length,
      ...sortItems<IDeploymentField>(
        columnIndex,
        proposedSortOrder,
        sortFunctions,
        columns,
        rawTableItems
      )
    );
  }
);

export const DeploymentTable: React.FC<ITableProps> = (props: ITableProps) => {
  tableItems = new ObservableArray<IDeploymentField>(props.deploymentRows);
  rawTableItems = props.deploymentRows;
  initSortFunctions(props.clusterSyncAvailable);
  columns = [
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
      sortProps: {
        ariaLabelAscending: "Sorted A to Z",
        ariaLabelDescending: "Sorted Z to A"
      },
      width: new ObservableValue(180)
    },
    {
      id: "environment",
      name: "Ring",
      renderCell: renderSimpleText,
      sortProps: {
        ariaLabelAscending: "Sorted A to Z",
        ariaLabelDescending: "Sorted Z to A"
      },
      width: new ObservableValue(220)
    },
    {
      id: "authorName",
      name: "Author",
      renderCell: renderAuthor,
      sortProps: {
        ariaLabelAscending: "Sorted A to Z",
        ariaLabelDescending: "Sorted Z to A"
      },
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
      sortProps: {
        ariaLabelAscending: "Sorted A to Z",
        ariaLabelDescending: "Sorted Z to A"
      },
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
      sortProps: {
        ariaLabelAscending: "Sorted low to high",
        ariaLabelDescending: "Sorted high to low"
      },
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
        behaviors={[sortingBehavior]}
        columns={columns}
        pageSize={props.deploymentRows.length}
        role="table"
        itemProvider={tableItems}
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

export const initSortFunctions = (isClusterSyncAvailable: boolean) => {
  sortFunctions = [
    null,
    // Sort on Service column
    (item1: IDeploymentField, item2: IDeploymentField): number => {
      return item1.service && item2.environment
        ? item1.service!.localeCompare(item2.service!)
        : 1;
    },
    // Sort on Ring/Environment column
    (item1: IDeploymentField, item2: IDeploymentField): number => {
      return item1.environment && item2.environment
        ? item1.environment!.localeCompare(item2.environment!)
        : 1;
    },
    // Sort on Author
    (item1: IDeploymentField, item2: IDeploymentField): number => {
      return item1.authorName && item2.authorName
        ? item1.authorName!.localeCompare(item2.authorName!)
        : 1;
    },
    // Sort on SRC to ACR
    null,
    // Sort on ACR to HLD
    null,
    // Sort on Approval Pull Request
    null,
    // Sort on Merged By
    (item1: IDeploymentField, item2: IDeploymentField): number => {
      return item1.mergedByName && item2.mergedByName
        ? item1.mergedByName!.localeCompare(item2.mergedByName!)
        : 1;
    },
    // Sort on HLD to Manifest
    null,
    // SORT on Last Updated
    (item1: IDeploymentField, item2: IDeploymentField): number => {
      return item1.endTime!.getTime() - item2.endTime!.getTime();
    }
  ];

  if (isClusterSyncAvailable) {
    // Sort on Synced Cluster
    sortFunctions.push(null);
  }
};
