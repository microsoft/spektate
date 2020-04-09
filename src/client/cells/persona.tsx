import { ITableColumn, SimpleTableCell } from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import { VssPersona } from "azure-devops-ui/VssPersona";
import * as React from "react";
import { IDeploymentField } from "../Dashboard.types";

interface IPersonaProps {
  rowIndex: number;
  columnIndex: number;
  tableColumn: ITableColumn<IDeploymentField>;
  tableItem: IDeploymentField;
  name: string;
  imageUrl?: string;
}

export const Persona: React.FC<IPersonaProps> = (props: IPersonaProps) => {
  if (!props.tableItem[props.tableColumn.id]) {
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
      contentClassName="font-size-m text-ellipsis bolt-table-link bolt-table-inline-link"
    >
      <VssPersona displayName={name} imageUrl={props.imageUrl} />
      <div>&nbsp;&nbsp;&nbsp;</div>
      <div className="flex-row scroll-hidden">
        <Tooltip overflowOnly={true}>
          <span className="text-ellipsis">
            {props.tableItem[props.tableColumn.id]}
          </span>
        </Tooltip>
      </div>
    </SimpleTableCell>
  );
};
