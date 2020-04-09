import { Status as StatusControl, StatusSize } from "azure-devops-ui/Status";
import { ITableColumn, SimpleTableCell } from "azure-devops-ui/Table";
import * as React from "react";
import { IDeploymentField } from "../Dashboard.types";
import { getStatusIndicatorData } from "./icons";

interface IStatusProps {
  columnIndex: number;
  tableColumn: ITableColumn<IDeploymentField>;
  status: string;
}
export const Status: React.FC<IStatusProps> = (props: IStatusProps) => {
  if (!props.status) {
    return (
      <SimpleTableCell
        key={"col-" + props.columnIndex}
        columnIndex={props.columnIndex}
      />
    );
  }
  const indicatorData = getStatusIndicatorData(props.status);
  return (
    <SimpleTableCell
      columnIndex={props.columnIndex}
      tableColumn={props.tableColumn}
      key={"col-" + props.columnIndex}
      contentClassName="fontWeightSemiBold font-weight-semibold fontSizeM font-size-m scroll-hidden"
    >
      <StatusControl
        {...indicatorData.statusProps}
        className={"icon-large-margin " + indicatorData.classname}
        size={StatusSize.l}
      />
    </SimpleTableCell>
  );
};
