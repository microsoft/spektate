import { Icon, IIconProps } from "azure-devops-ui/Icon";
import { Statuses } from "azure-devops-ui/Status";
import * as React from "react";
import { IStatusIndicatorData } from "../Dashboard.types";

/**
 * Icon colors based on color palette that follows rules certain rules
 * https://projects.susielu.com/viz-palette?colors=%5B%22#2aa05b%22,%22%23e08a00%22,%22%23c8281f%22%5D&backgroundColor=%22white%22&fontColor=%22black%22&mode=%22normal%22
 */
const iconColors = {
  blue: "#0a78d4",
  gray: "#3b606d",
  green: "#2aa05b",
  purple: "#5b50e2",
  red: "#c8281f",
  yellow: "#e08a00",
};

/**
 * Returns icon HTML for icon props
 */
export const WithIcon = (props: {
  className?: string;
  iconProps: IIconProps;
  children?: React.ReactNode;
}): React.ReactNode => {
  return (
    <div className="flex-row flex-center">
      {Icon({ ...props.iconProps, className: "icon-margin" })}
      {props.children}
    </div>
  );
};

/**
 * Returns status indicator
 * @param statusStr status string, such as successful, in progress etc.
 */
export const getStatusIndicatorData = (
  statusStr: string
): IStatusIndicatorData => {
  statusStr = statusStr || "";
  statusStr = statusStr.toLowerCase();
  const indicatorData: IStatusIndicatorData = {
    classname: "icon-green",
    label: "Success",
    statusProps: {
      ...Statuses.Success,
      ariaLabel: "Success",
      color: iconColors.green,
    },
  };
  switch (statusStr.toLowerCase()) {
    case "failed":
      indicatorData.statusProps = {
        ...Statuses.Failed,
        ariaLabel: "Failed",
        color: iconColors.red,
      };
      indicatorData.label = "Failed";
      indicatorData.classname = "icon-red";
      break;
    case "in progress":
      indicatorData.statusProps = {
        ...Statuses.Running,
        ariaLabel: "Running",
        color: iconColors.blue,
      };
      indicatorData.label = "Running";
      indicatorData.classname = "icon-blue";
      break;
    case "waiting":
      indicatorData.statusProps = {
        ...Statuses.Waiting,
        ariaLabel: "Waiting",
        color: iconColors.purple,
      };
      indicatorData.label = "Waiting";
      indicatorData.classname = "icon-purple";
      break;
    case "incomplete":
      indicatorData.statusProps = {
        ...Statuses.Warning,
        ariaLabel: "Incomplete",
        color: iconColors.yellow,
      };
      indicatorData.label = "Incomplete";
      indicatorData.classname = "icon-yellow";
      break;
    case "canceled":
      indicatorData.statusProps = {
        ...Statuses.Canceled,
        ariaLabel: "Canceled",
        color: iconColors.gray,
      };
      indicatorData.label = "Canceled";
      indicatorData.classname = "icon-gray";
      break;
  }
  return indicatorData;
};

/**
 * Returns icon for a status
 * @param statusStr status string, such as succeeded, in progress etc.
 */
export const getIcon = (statusStr?: string): IIconProps => {
  if (statusStr === "succeeded") {
    return {
      iconName: "SkypeCircleCheck",
      style: { color: iconColors.green },
    };
  } else if (statusStr === undefined || statusStr === "inProgress") {
    return { iconName: "AwayStatus", style: { color: iconColors.blue } }; // SyncStatusSolid
  } else if (statusStr === "canceled") {
    return {
      iconName: "SkypeCircleSlash",
      style: { color: iconColors.gray },
    };
  } else if (statusStr === "waiting") {
    return { iconName: "AwayStatus", style: { color: iconColors.purple } };
  }
  return { iconName: "StatusErrorFull", style: { color: iconColors.red } };
};
