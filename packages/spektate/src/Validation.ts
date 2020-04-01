import * as azure from "azure-storage";
import {
  fetchAuthor,
  getDeployments,
  getRepositoryFromURL,
  IDeployment
} from "./IDeployment";
import { AzureDevOpsPipeline } from "./pipeline/AzureDevOpsPipeline";
import { IAuthor } from "./repository";
import {
  getManifestSyncState as getADOClusterSync,
  IAzureDevOpsRepo
} from "./repository/IAzureDevOpsRepo";
import {
  getManifestSyncState as getGitHubClusterSync,
  IGitHub
} from "./repository/IGitHub";

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
  const manifestRepoError = await verifyManifestRepo(
    manifestRepo,
    manifestAccessToken,
    orgName,
    projectName,
    manifestRepoGitHubOrgOrUsername
  );
  if (manifestRepoError) {
    errors.push(manifestRepoError);
  }
  const sourceRepoAccessError = await verifySourceRepoAccess(
    storageAccountName,
    storageAccountKey,
    storageTableName,
    storagePartitionKey,
    sourceRepoAccessToken,
    createPipeline(orgName, projectName, pipelinePAT),
    createPipeline(orgName, projectName, pipelinePAT),
    createPipeline(orgName, projectName, pipelinePAT)
  );
  if (sourceRepoAccessError) {
    errors.push(sourceRepoAccessError);
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
    await pipeline.getListOfBuilds();
    return undefined;
  } catch (e) {
    return {
      message:
        "Pipeline org, project or personal access token are invalid. " +
        e.toString()
    };
  }
};

export const verifyManifestRepo = async (
  repoName: string,
  pat: string,
  org: string,
  project: string,
  githubUsername?: string
): Promise<IValidationError | undefined> => {
  return new Promise<IValidationError | undefined>(async (resolve, reject) => {
    let repo: IAzureDevOpsRepo | IGitHub | undefined;
    if (githubUsername && githubUsername !== "") {
      repo = {
        reponame: repoName,
        username: githubUsername
      };
      await getGitHubClusterSync(repo, pat)
        .then(tags => {
          resolve();
        })
        .catch(e => {
          resolve({
            message:
              "Failed to verify manifest repo for cluster sync status. " +
              e.toString()
          });
        });
    } else if (repoName !== "") {
      repo = {
        org,
        project,
        repo: repoName
      };
      await getADOClusterSync(repo, pat)
        .then(tags => {
          resolve();
        })
        .catch(e => {
          resolve({
            message:
              "Failed to verify manifest repo for cluster sync status. " +
              e.toString()
          });
        });
    } else {
      return {
        message: "Manifest repository could not be recognized. "
      };
    }
  });
};

const createPipeline = (org: string, project: string, token?: string) => {
  return new AzureDevOpsPipeline(org, project, token);
};

export const verifySourceRepoAccess = async (
  storageAccountName: string,
  storageAccountKey: string,
  storageTableName: string,
  storagePartitionKey: string,
  sourceRepoAccessToken: string,
  srcPipeline: AzureDevOpsPipeline,
  hldPipeline: AzureDevOpsPipeline,
  manifestPipeline: AzureDevOpsPipeline
): Promise<IValidationError | undefined> => {
  return new Promise<IValidationError | undefined>(async (resolve, reject) => {
    try {
      const deployments: IDeployment[] = await getDeployments(
        storageAccountName,
        storageAccountKey,
        storageTableName,
        storagePartitionKey,
        srcPipeline,
        hldPipeline,
        manifestPipeline,
        undefined
      );

      if (deployments.length !== 0) {
        // Attempt to get author for the first deployment to verify source repo access
        const deployment = deployments[0];

        let repo: IAzureDevOpsRepo | IGitHub | undefined =
          deployment.srcToDockerBuild?.repository ||
          (deployment.sourceRepo
            ? getRepositoryFromURL(deployment.sourceRepo)
            : undefined);
        if (!repo && (deployment.hldToManifestBuild || deployment.hldRepo)) {
          repo =
            deployment.hldToManifestBuild!.repository ||
            (deployment.hldRepo
              ? getRepositoryFromURL(deployment.hldRepo)
              : undefined);
        }
        const commit =
          deployment.srcToDockerBuild?.sourceVersion ||
          deployment.hldToManifestBuild?.sourceVersion;
        if (repo && commit) {
          fetchAuthor(repo, commit, sourceRepoAccessToken)
            .then((author: IAuthor | undefined) => {
              if (author) {
                resolve();
              } else {
                resolve({
                  message:
                    "Failed verification of source repo access. Please verify your source repo access token is valid."
                });
              }
            })
            .catch(e => {
              resolve({
                message:
                  "Failed verification of source repo access. " + e.toString()
              });
            });
        } else {
          resolve({
            message:
              "Source repo access could not be verified. Either the table is missing sufficient data to verify, or data is invalid in storage."
          });
        }
      } else {
        resolve({
          message:
            "No deployments exist in storage to verify source repo access. "
        });
      }
    } catch (e) {
      resolve({
        message:
          "Error occurred while verifying source repo access. " + e.toString()
      });
    }
  });
};
