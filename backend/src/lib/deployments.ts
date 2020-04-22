import { getDeployments, IDeployment } from "spektate/lib/IDeployment";
import AzureDevOpsPipeline from "spektate/lib/pipeline/AzureDevOpsPipeline";
import * as config from "../config";

const createSourcePipeline = () => {
  return new AzureDevOpsPipeline(
    config.AZURE_ORG,
    config.AZURE_PROJECT,
    false,
    config.AZURE_PIPELINE_ACCESS_TOKEN
  );
};

const createHLDPipeline = () => {
  return new AzureDevOpsPipeline(
    config.AZURE_ORG,
    config.AZURE_PROJECT,
    true,
    config.AZURE_PIPELINE_ACCESS_TOKEN
  );
};

const createClusterPipeline = () => {
  return new AzureDevOpsPipeline(
    config.AZURE_ORG,
    config.AZURE_PROJECT,
    false,
    config.AZURE_PIPELINE_ACCESS_TOKEN
  );
};

export const list = async (): Promise<IDeployment[]> => {
  const srcPipeline = createSourcePipeline();
  const hldPipeline = createHLDPipeline();
  const clusterPipeline = createClusterPipeline();

  if (!config.isValuesValid()) {
    throw Error("Invalid configuration");
  }

  return await getDeployments(
    config.STORAGE_ACCOUNT_NAME,
    config.STORAGE_ACCOUNT_KEY,
    config.STORAGE_TABLE_NAME,
    config.STORAGE_PARTITION_KEY,
    srcPipeline,
    hldPipeline,
    clusterPipeline,
    undefined
  );
};
