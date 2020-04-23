import { getDeployments, IDeployment } from "spektate/lib/IDeployment";
import AzureDevOpsPipeline from "spektate/lib/pipeline/AzureDevOpsPipeline";
import { getConfig, isConfigValid } from "../config";

const createPipeline = () => {
  const config = getConfig();
  return new AzureDevOpsPipeline(
    config.org,
    config.project,
    config.pipelineAccessToken
  );
};

export const list = async (): Promise<IDeployment[]> => {
  // Create three instances of pipelines
  const srcPipeline = createPipeline();
  const hldPipeline = createPipeline();
  const clusterPipeline = createPipeline();
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
