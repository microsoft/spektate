import { Link } from "azure-devops-ui/Link";
import {
  ITableColumn,
  SimpleTableCell,
  TwoLineTableCell
} from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import * as React from "react";
import { IDeploymentField } from "../Dashboard.types";

interface IClusterProps {
  columnIndex: number;
  tableColumn: ITableColumn<IDeploymentField>;
  deployment: IDeploymentField;
  releasesUrl?: string;
}
export const Cluster: React.FC<IClusterProps> = (props: IClusterProps) => {
  if (!props.deployment.clusters || props.deployment.clusters.length === 0) {
    return (
      <SimpleTableCell
        key={"col-" + props.columnIndex}
        columnIndex={props.columnIndex}
      >
        -
      </SimpleTableCell>
    );
  }
  const strClusters = props.deployment.clusters.join(", ");
  if (props.deployment.clusters.length > 2) {
    return (
      <TwoLineTableCell
        className="first-row no-cell-top-border bolt-table-cell-content-with-inline-link no-v-padding"
        key={"col-" + props.columnIndex}
        columnIndex={props.columnIndex}
        tableColumn={props.tableColumn}
        line1={renderCluster(
          props.deployment.clusters[0] + ", " + props.deployment.clusters[1],
          props.deployment.clusters!,
          props.releasesUrl
        )}
        line2={renderCluster(
          "and " + (props.deployment.clusters.length - 2) + " more...",
          props.deployment.clusters!,
          props.releasesUrl
        )}
      />
    );
  }
  return (
    <SimpleTableCell
      columnIndex={props.columnIndex}
      key={"col-" + props.columnIndex}
    >
      {renderCluster(
        strClusters,
        props.deployment.clusters!,
        props.releasesUrl
      )}
    </SimpleTableCell>
  );
};

export const renderCluster = (
  text: string,
  allClusters: string[],
  releasesUrl?: string
): React.ReactNode => {
  return (
    <Tooltip
      // tslint:disable-next-line: jsx-no-lambda
      renderContent={() => renderCustomClusterTooltip(allClusters)}
      overflowOnly={false}
    >
      <Link
        className="font-size-m text-ellipsis bolt-table-link bolt-table-inline-link"
        href={releasesUrl}
        subtle={true}
      >
        {text}
      </Link>
    </Tooltip>
  );
};

export const renderCustomClusterTooltip = (clusters: string[]) => {
  const tooltip: React.ReactNode[] = [];
  clusters.forEach(cluster => {
    tooltip.push(
      <span>
        {cluster}
        <br />
      </span>
    );
  });
  return <span>{tooltip}</span>;
};
