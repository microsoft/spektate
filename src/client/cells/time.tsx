import { Ago } from "azure-devops-ui/Ago";
import { Duration } from "azure-devops-ui/Duration";
import {
  ITableColumn,
  SimpleTableCell,
  TwoLineTableCell
} from "azure-devops-ui/Table";
import * as React from "react";
import { IDeploymentField } from "../Dashboard.types";
import { WithIcon } from "./icons";

/**
 * Interface for last updated time cell props
 */
interface ITimeProps {
  columnIndex: number;
  tableColumn: ITableColumn<IDeploymentField>;
  deployment: IDeploymentField;
}
export const Time: React.FC<ITimeProps> = (props: ITimeProps) => {
  if (!props.deployment.startTime || !props.deployment.endTime) {
    return (
      <SimpleTableCell
        key={"col-" + props.columnIndex}
        columnIndex={props.columnIndex}
      />
    );
  }
  return (
    <TwoLineTableCell
      key={"col-" + props.columnIndex}
      columnIndex={props.columnIndex}
      tableColumn={props.tableColumn}
      line1={WithIcon({
        children: <Ago date={new Date(props.deployment.endTime!)} />,
        className: "fontSize font-size",
        iconProps: { iconName: "Calendar" }
      })}
      line2={WithIcon({
        children: (
          <Duration
            startDate={new Date(props.deployment.startTime!)}
            endDate={new Date(props.deployment.endTime!)}
          />
        ),
        className: "fontSize font-size bolt-table-two-line-cell-item",
        iconProps: { iconName: "Clock" }
      })}
    />
  );
};
