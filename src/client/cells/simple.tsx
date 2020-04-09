import { ITableColumn, SimpleTableCell } from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import * as React from "react";
import { IDeploymentField } from "../Dashboard.types";

interface ISimpleProps {
  columnIndex: number;
  tableColumn: ITableColumn<IDeploymentField>;
  text?: string;
}

export const Simple: React.FC<ISimpleProps> = (props: ISimpleProps) => {
  if (!props.text) {
    return (
      <SimpleTableCell
        key={"col-" + props.columnIndex}
        columnIndex={props.columnIndex}
      />
    );
  }
  return (
    <SimpleTableCell
      columnIndex={props.columnIndex}
      tableColumn={props.tableColumn}
      key={"col-" + props.columnIndex}
      contentClassName="fontSizeM font-size-m scroll-hidden"
    >
      <div className="flex-row scroll-hidden">
        <Tooltip overflowOnly={true}>
          <span className="text-ellipsis">{props.text}</span>
        </Tooltip>
      </div>
    </SimpleTableCell>
  );
};
