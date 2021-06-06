
import { Ago } from "azure-devops-ui/Ago";
import { Button } from "azure-devops-ui/Button";
import { ObservableArray, ObservableValue } from "azure-devops-ui/Core/Observable";
import { Link } from "azure-devops-ui/Link";
import { Panel } from "azure-devops-ui/Panel";
import {
  ITableColumn,
  renderSimpleCell,
  SimpleTableCell,

  Table,
  TableColumnLayout,
  // TwoLineTableCell,

} from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { AgoFormat } from "azure-devops-ui/Utilities/Date";
import * as React from "react";
import { IDeploymentField } from "../Dashboard.types";

/**
 * Interface for cluster cell props
 */
interface IClusterProps {
  columnIndex: number;
  tableColumn: ITableColumn<IDeploymentField>;
  deployment: IDeploymentField;
  releasesUrl?: string;
}
export const Cluster: React.FC<IClusterProps> = (props: IClusterProps) => {
  console.log(props.deployment.fluxStatus);
  const [expanded, setExpanded] = React.useState(false);

  if (props.deployment.fluxStatus !== undefined && props.deployment.fluxStatus.length > 0) {

    return (
      <SimpleTableCell
        columnIndex={props.columnIndex}
        key={"col-" + props.columnIndex}
      >
        <div>
          <Button
            // tslint:disable-next-line: jsx-no-lambda
            onClick={() => setExpanded(true)}>{props.deployment.fluxStatus[0].commitId}</Button>
          {expanded && (
            <Panel

              // tslint:disable-next-line: jsx-no-lambda
              onDismiss={() => setExpanded(false)}
              titleProps={{ text: "Cluster Status" }}
              // description={
              //   "A description of the header. It can expand to multiple lines. Consumers should try to limit this to a maximum of three lines."
              // }
              footerButtonProps={[
                // tslint:disable-next-line: jsx-no-lambda
                { text: "OK", onClick: () => setExpanded(false), primary: true }
              ]}
            >
              {/* <div>{props.deployment.fluxStatus.message}</div> */}
              <FluxTable deployment={props.deployment}
                columnIndex={props.columnIndex}
                tableColumn={props.tableColumn} />
            </Panel>
          )}
        </div>
      </SimpleTableCell>
    );
  }

  return (
    <SimpleTableCell
      key={"col-" + props.columnIndex}
      columnIndex={props.columnIndex}
    >
      -
    </SimpleTableCell>
  );
};

const FluxTable: React.FC<IClusterProps> = (props: IClusterProps) => {
  const tableItems = new ObservableArray<any>(props.deployment.fluxStatus);

  const fixedColumns = [
    {
      columnLayout: TableColumnLayout.singleLinePrefix,
      id: "message",
      name: "Message",
      readonly: true,
      renderCell: renderSimpleCell,
      width: new ObservableValue(200)
    },
    {
      columnLayout: TableColumnLayout.singleLinePrefix,
      id: "time",
      name: "Time",
      readonly: true,
      renderCell: renderTime,
      width: new ObservableValue(200)
    }
  ];
  return (
    <Table columns={fixedColumns} itemProvider={tableItems} />
  );
}

export const renderTime = (
  rowIndex: number,
  columnIndex: number,
  tableColumn: ITableColumn<any>,
  fluxStatus: any
): JSX.Element => {
  console.log(JSON.stringify(fluxStatus));
  const timestamp = Date.parse(fluxStatus.time);

  if (isNaN(timestamp) === false) {
    const date = new Date(fluxStatus.time);
    return (
      <SimpleTableCell
        key={"col-" + columnIndex}
        columnIndex={columnIndex}
      >
        <Ago date={date} format={AgoFormat.Extended}
        />
      </SimpleTableCell>
    );
  }

  return (
    <SimpleTableCell
      key={"col-" + columnIndex}
      columnIndex={columnIndex}
    >
      -
    </SimpleTableCell>
  );
}

// export const Cluster: React.FC<IClusterProps> = (props: IClusterProps) => {
//   if (!props.deployment.clusters || props.deployment.clusters.length === 0) {
//     return (
//       <SimpleTableCell
//         key={"col-" + props.columnIndex}
//         columnIndex={props.columnIndex}
//       >
//         -
//       </SimpleTableCell>
//     );
//   }
//   const strClusters = props.deployment.clusters.join(", ");

//   // If there are more than two clusters, don't show their names but show as "and n more..."
//   if (props.deployment.clusters.length > 2) {
//     return (
//       <TwoLineTableCell
//         className="first-row no-cell-top-border bolt-table-cell-content-with-inline-link no-v-padding"
//         key={"col-" + props.columnIndex}
//         columnIndex={props.columnIndex}
//         tableColumn={props.tableColumn}
//         line1={renderCluster(
//           props.deployment.clusters[0] + ", " + props.deployment.clusters[1],
//           props.deployment.clusters!,
//           props.releasesUrl
//         )}
//         line2={renderCluster(
//           "and " + (props.deployment.clusters.length - 2) + " more...",
//           props.deployment.clusters!,
//           props.releasesUrl
//         )}
//       />
//     );
//   }
//   return (
//     <SimpleTableCell
//       columnIndex={props.columnIndex}
//       key={"col-" + props.columnIndex}
//     >
//       {renderCluster(
//         strClusters,
//         props.deployment.clusters!,
//         props.releasesUrl
//       )}
//     </SimpleTableCell>
//   );
// };

/**
 * Renders a single cluster name with tooltip and link
 * @param text text to display
 * @param allClusters list of all other clusters to show as tooltip
 * @param releasesUrl url link
 */
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

/**
 * Renders tooltip for cluster
 * @param clusters text to be rendered inside tooltip
 */
export const renderCustomClusterTooltip = (clusters: string[]) => {
  const tooltip: React.ReactNode[] = [];
  clusters.forEach((cluster) => {
    tooltip.push(
      <span>
        {cluster}
        <br />
      </span>
    );
  });
  return <span>{tooltip}</span>;
};
