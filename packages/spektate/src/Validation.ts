import * as azure from "azure-storage";
import { AzureDevOpsPipeline } from "./pipeline/AzureDevOpsPipeline";

export interface IValidationError {
  message: string;
  code?: string;
  stack?: string;
}
export interface IErrors {
  errors: IValidationError[];
}
export const validateConfiguration = async (
  storageAccountName: string,
  storageAccountKey: string,
  storageTableName: string,
  storagePartitionKey: string,
  orgName: string,
  projectName: string,
  pipelinePAT: string,
  sourceRepoAccessToken: string,
  manifestRepo: string,
  manifestAccessToken: string,
  manifestRepoGitHubOrgOrUsername?: string
): Promise<IErrors> => {
  const errors: IValidationError[] = [];
  const storageError = await verifyStorageCredentials(
    storageAccountName,
    storageAccountKey,
    storageTableName,
    storagePartitionKey
  );
  if (storageError) {
    errors.push(storageError);
  }
  const pipelineError = await verifyPipeline(orgName, projectName, pipelinePAT);
  if (pipelineError) {
    errors.push(pipelineError);
  }

  return {
    errors
  };
};

export const verifyStorageCredentials = async (
  storageAccountName: string,
  storageAccountKey: string,
  storageTableName: string,
  storagePartitionKey: string
): Promise<IValidationError | undefined> => {
  try {
    const tableService = azure.createTableService(
      storageAccountName,
      storageAccountKey
    );
    return new Promise((resolve, reject) => {
      tableService.doesTableExist(
        storageTableName,
        (err: Error, result, response) => {
          if (!err && result) {
            if (!result.exists || !result.isSuccessful) {
              resolve({
                code: result.statusCode?.toString(),
                message:
                  "Storage table " + storageTableName + " does not exist."
              });
            }
            if (storagePartitionKey !== "") {
              resolve();
            } else {
              resolve({
                message: "Partition key needs to be non-empty"
              });
            }
          } else {
            resolve({
              message: err.message,
              stack: err.stack
            });
          }
        }
      );
    });
  } catch (e) {
    return {
      message: e.message
    };
  }
};

export const verifyPipeline = async (
  org: string,
  project: string,
  pat: string
): Promise<IValidationError | undefined> => {
  try {
    const pipeline = new AzureDevOpsPipeline(org, project, pat);
    const builds = await pipeline.getListOfBuilds();
    return undefined;
  } catch (e) {
    return {
      message:
        "Pipeline org, project or personal access token are invalid. " +
        e.message
    };
  }
};

export const verifyManifestRepo = (
  repo: string,
  pat: string,
  githubUsername?: string
): IValidationError | undefined => {
  return undefined;
};
