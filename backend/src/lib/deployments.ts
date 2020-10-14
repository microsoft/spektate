import { getDeployments, IDeployment } from "spektate/lib/IDeployment";
import AzureDevOpsPipeline from "spektate/lib/pipeline/AzureDevOpsPipeline";
import { getConfig, isConfigValid } from "../config";
import GithubActions from "spektate/lib/pipeline/GithubActions";

/**
 * Create instance of AzDO pipeline
 */
const createPipeline = () => {
  const config = getConfig();
  if (config.org !== "" && config.project !== "") {
    console.log(`Creating an Azdo instance`);
    return new AzureDevOpsPipeline(
      config.org,
      config.project,
      config.pipelineAccessToken
    );
  } else if (config.sourceRepo !== "") {
    console.log(`Creating a github actions instance`);
    return new GithubActions(config.sourceRepo, config.pipelineAccessToken);
  }

  throw new Error("Configuration is invalid");
};

const createManifestPipeline = () => {
  const config = getConfig();
  if (config.org !== "" && config.project !== "") {
    return createPipeline();
  } else if (config.hldRepo !== "") {
    console.log(`Creating a github actions instance`);
    return new GithubActions(config.hldRepo, config.pipelineAccessToken);
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
  const config = getConfig();

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
