import {
  getDeployments,
  IDeployment,
  getRepositoryFromURL,
} from "spektate/lib/IDeployment";
import AzureDevOpsPipeline from "spektate/lib/pipeline/AzureDevOpsPipeline";
import {
  getNewConfig,
  isConfigValid,
  PipelineType,
  IAzDOPipelineConfig,
  IGitlabRepoConfig,
  IGithubRepoConfig,
} from "../config";
import GithubActions from "spektate/lib/pipeline/GithubActions";
import GitlabPipeline from "spektate/lib/pipeline/GitlabPipeline";
import { IGitHub } from "spektate/lib/repository/IGitHub";

/**
 * Create instance of AzDO pipeline
 */
const createPipeline = () => {
  const config = getNewConfig();
  if (config.pipelineType === PipelineType.AZDO) {
    return new AzureDevOpsPipeline(
      (config.pipelineConfig as IAzDOPipelineConfig).org,
      (config.pipelineConfig as IAzDOPipelineConfig).project!,
      (config.pipelineConfig as IAzDOPipelineConfig).accessToken
    );
  } else if (config.pipelineType === PipelineType.GITHUB_ACTIONS) {
    const sourceRepo = getRepositoryFromURL(
      (config.repoConfig as IGithubRepoConfig).sourceRepo
    ) as IGitHub;
    return new GithubActions(
      sourceRepo.username + "/" + sourceRepo.reponame,
      (config.repoConfig as IGithubRepoConfig).accessToken!
    );
  } else if (config.pipelineType === PipelineType.GITLAB) {
    return new GitlabPipeline(
      (config.repoConfig as IGitlabRepoConfig).sourceRepoProjectId,
      config.pipelineConfig.accessToken
    );
  }

  throw new Error("Configuration is invalid");
};

const createManifestPipeline = () => {
  const config = getNewConfig();
  if (config.pipelineType === PipelineType.AZDO) {
    return createPipeline();
  } else if (config.pipelineType === PipelineType.GITHUB_ACTIONS) {
    const hldRepo = getRepositoryFromURL(
      (config.repoConfig as IGithubRepoConfig).hldRepo
    ) as IGitHub;
    return new GithubActions(
      hldRepo.username + "/" + hldRepo.reponame,
      (config.repoConfig as IGithubRepoConfig).accessToken!
    );
  } else if (config.pipelineType === PipelineType.GITLAB) {
    return new GitlabPipeline(
      (config.repoConfig as IGitlabRepoConfig).hldRepoProjectId,
      config.pipelineConfig.accessToken
    );
  }
  throw new Error("Configuration is invalid");
};

/**
 * Fetches deployments
 */
export const list = async (): Promise<IDeployment[]> => {
  // Create three instances of pipelines
  const srcPipeline = createPipeline();
  const hldPipeline = createPipeline();
  const clusterPipeline = createManifestPipeline();
  const config = getNewConfig();

  if (!isConfigValid()) {
    throw Error("Invalid configuration");
  }

  return await getDeployments(
    config.storageAccountName,
    config.storageAccessKey,
    config.storageTableName,
    config.storagePartitionKey,
    srcPipeline,
    hldPipeline,
    clusterPipeline,
    undefined
  );
};
