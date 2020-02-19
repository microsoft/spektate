import { Request, Response } from "express";
import {
  // fetchAuthor,
  getDeployments,
  IDeployment
} from "spektate/lib/IDeployment";
import AzureDevOpsPipeline from "spektate/lib/pipeline/AzureDevOpsPipeline";
// import { IAuthor } from "spektate/lib/repository/Author";
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

    await Promise.all(
      deployments.map(d => {
        return new Promise(resolve => {
          // fetchAuthor(
          //   d,
          //   config.SOURCE_REPO_ACCESS_TOKEN ||
          //     config.AZURE_PIPELINE_ACCESS_TOKEN
          // )
          //   .then((author: IAuthor) => {
          //     resolve(author);
          //     d.author = author;
          //     console.log("Got author again");
          //     console.log(d.author);
          //   })
          //   .catch(e => {
          //     console.error(e);
          //     resolve();
          //   });
          resolve();
        });
      })
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
