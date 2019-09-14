import { IStatusProps } from "azure-devops-ui/Status";
import Deployment from "spektate/dist/Deployment";
import { IAuthor } from "spektate/dist/repository/Author";
import { ITag } from "spektate/dist/repository/Tag";

export interface IStatusIndicatorData {
  statusProps: IStatusProps;
  label: string;
}
export interface IAuthors {
  [commitId: string]: IAuthor;
}
export interface IDashboardState {
  deployments: Deployment[];
  manifestSync?: ITag;
  authors: IAuthors;
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
  clusterSyncDate?: Date;
  endTime?: Date;
  authorName?: string;
  authorURL?: string;
}
