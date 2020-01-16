import { IStatusProps } from "azure-devops-ui/Status";
import Deployment from "spektate/lib/Deployment";
import { IAuthor } from "spektate/lib/repository/Author";
import { ITag } from "spektate/lib/repository/Tag";

export interface IStatusIndicatorData {
  statusProps: IStatusProps;
  label: string;
}
export interface IAuthors {
  [commitId: string]: IAuthor;
}

export interface IDashboardFilterState {
  currentlySelectedServices?: string[];
  currentlySelectedEnvs?: string[];
  currentlySelectedAuthors?: string[];
  currentlySelectedKeyword?: string;
  defaultApplied: boolean;
}
export interface IDashboardState {
  deployments: Deployment[];
  manifestSyncStatuses?: ITag[];
  authors: IAuthors;
  filteredDeployments: Deployment[];
}
export interface IDeploymentField {
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
  clusterSync?: boolean;
  clusters?: string[];
  clusterSyncDate?: Date;
  endTime?: Date;
  authorName?: string;
  authorURL?: string;
}
