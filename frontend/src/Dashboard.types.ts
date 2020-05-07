import { IStatusProps } from "azure-devops-ui/Status";
import { IDeployment } from "spektate/lib/IDeployment";
import { IAuthor } from "spektate/lib/repository/Author";
import { IPullRequest } from "spektate/lib/repository/IPullRequest";
import { IClusterSync, ITag } from "spektate/lib/repository/Tag";

export interface IStatusIndicatorData {
  statusProps: IStatusProps;
  label: string;
  classname: string;
}
export interface IAuthors {
  [commitId: string]: IAuthor;
}
export interface IPRs {
  [pr: string]: IPullRequest;
}

export interface IDeploymentData extends IDeployment {
  author?: IAuthor | undefined;
  pullRequest?: IPullRequest | undefined;
}

export enum DeploymentType {
  DEPLOYMENT = "Bedrock Deployments",
  HLD_EDIT = "Manual HLD Edits",
}

export interface IDeployments {
  deployments: IDeploymentData[];
  clusterSync: IClusterSync | undefined;
}

export interface IDashboardFilterState {
  currentlySelectedServices?: string[];
  currentlySelectedEnvs?: string[];
  currentlySelectedAuthors?: string[];
  currentlySelectedTypes?: string[];
  currentlySelectedKeyword?: string;
  defaultApplied: boolean;
}

export interface IDashboardState {
  deployments: IDeploymentData[];
  manifestSyncStatuses?: ITag[];
  filteredDeployments: IDeploymentData[];
  error?: string;
  rowLimit: number;
  refreshRate: number;
}

export interface IDeploymentField {
  deploymentType?: DeploymentType;
  deploymentId: string;
  service: string;
  startTime?: Date;
  imageTag?: string;
  srcCommitId?: string;
  srcBranchName?: string;
  srcCommitURL?: string;
  srcPipelineId?: string;
  srcPipelineURL?: string;
  srcPipelineResult?: string;
  dockerPipelineId?: string;
  dockerPipelineURL?: string;
  environment?: string;
  dockerPipelineResult?: string;
  hldCommitId?: string;
  hldCommitURL?: string;
  hldPipelineId?: string;
  hldPipelineURL?: string;
  hldPipelineResult?: string;
  duration: string;
  status: string;
  clusters?: string[];
  endTime?: Date;
  authorName?: string;
  authorURL?: string;
  pr?: number;
  prURL?: string;
  prSourceBranch?: string;
  mergedByName?: string;
  mergedByImageURL?: string;
  manifestCommitId?: string;
}
