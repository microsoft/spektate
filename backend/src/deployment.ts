import { Request, Response } from "express";
import { getDeployments, IDeployment } from "spektate/lib/IDeployment";
import AzureDevOpsPipeline from "spektate/lib/pipeline/AzureDevOpsPipeline";
import * as config from "./config";

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

export const get = async (req: Request, res: Response) => {
  res.header("Access-Control-Allow-Origin", "*");
  if (config.isValuesValid()) {
    const srcPipeline = createSourcePipeline();
    const hldPipeline = createHLDPipeline();
    const clusterPipeline = createClusterPipeline();

    const deployments: IDeployment[] = await getDeployments(
      config.STORAGE_ACCOUNT_NAME,
      config.STORAGE_ACCOUNT_KEY,
      config.STORAGE_TABLE_NAME,
      config.STORAGE_PARTITION_KEY,
      srcPipeline,
      hldPipeline,
      clusterPipeline,
      undefined
    );

    res.json(deployments);
  } else {
    res
      .status(500)
      .send(
        "Environment variables need to be exported for Spektate configuration"
      );
  }
};
