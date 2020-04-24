import { Link } from "azure-devops-ui/Link";
import {
  ITableColumn,
  SimpleTableCell,
  TwoLineTableCell,
} from "azure-devops-ui/Table";
import { Tooltip } from "azure-devops-ui/TooltipEx";
import * as React from "react";
import { IDeploymentField } from "../Dashboard.types";
import { getIcon, WithIcon } from "./icons";

/**
 * Interface for build cell props
 */
interface IBuildProps {
  columnIndex: number;
  tableColumn: ITableColumn<IDeploymentField>;
  pipelineResult?: string;
  pipelineId?: string;
  pipelineURL?: string;
  commitId?: string;
  commitURL?: string;
  iconName?: string;
}

export const Build: React.FC<IBuildProps> = (props: IBuildProps) => {
  if (!props.pipelineId || !props.pipelineURL || !props.commitId) {
    return (
      <SimpleTableCell
        key={"col-" + props.columnIndex}
        columnIndex={props.columnIndex}
      >
        -
      </SimpleTableCell>
    );
  }
  const commitCell = WithIcon({
    children: <div>{props.commitId}</div>,
    className: "",
    iconProps: { iconName: props.iconName },
  });
  return (
    <TwoLineTableCell
      className="first-row no-cell-top-border bolt-table-cell-content-with-inline-link no-v-padding"
      key={"col-" + props.columnIndex}
      columnIndex={props.columnIndex}
      tableColumn={props.tableColumn}
      iconProps={getIcon(props.pipelineResult)}
      line1={
        <Tooltip text={props.pipelineId} overflowOnly={true}>
          {props.pipelineURL && (
            <Link
              className="fontSizeM font-size-m text-ellipsis bolt-table-link bolt-table-inline-link"
              href={props.pipelineURL}
              // tslint:disable-next-line: jsx-no-lambda
              onClick={() => (parent.window.location.href = props.pipelineURL!)}
            >
              {props.pipelineId}
            </Link>
          )}
        </Tooltip>
      }
      line2={
        <Tooltip overflowOnly={true}>
          <span className="fontSize font-size secondary-text flex-row flex-center text-ellipsis">
            {props.commitId && props.commitURL && props.commitURL !== "" && (
              <Link
                className="monospaced-text text-ellipsis flex-row flex-center bolt-table-link bolt-table-inline-link"
                href={props.commitURL}
                // tslint:disable-next-line: jsx-no-lambda
                onClick={() => (parent.window.location.href = props.commitURL!)}
              >
                {commitCell}
              </Link>
            )}
            {props.commitId && props.commitURL === "" && commitCell}
          </span>
        </Tooltip>
      }
    />
  );
};
