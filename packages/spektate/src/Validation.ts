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

/**
 * Validation error interface
 */
export interface IValidationError {
  message: string;
  code?: string;
  stack?: string;
}

/**
 * Errors interface
 */
export interface IErrors {
  errors: IValidationError[];
}

/**
 * Validates all configuration for a spektate instance
 * @param storageAccountName storage account name
 * @param storageAccountKey storage account key0
 * @param storageTableName storage table name
 * @param storagePartitionKey storage partition key
 * @param orgName Azure DevOps organization name
 * @param projectName Azure DevOps project name
 * @param pipelinePAT Azure DevOps pipeline personal access token
 * @param sourceRepoAccessToken source repo access token (same as pipeline token if it has access)
 * @param manifestRepo manifest repo name (eg. test-manifests)
 * @param manifestAccessToken manifest repo access token (same as pipeline token if it has access)
 * @param manifestRepoGitHubOrgOrUsername GitHub organization or username for the manifest
 * repository, eg. for github.com/microsoft/bedrock.git, this would be "microsoft"
 */
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
  try {
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
    const pipelineError = await verifyPipeline(
      orgName,
      projectName,
      pipelinePAT
    );
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
  } catch (e) {
    return {
      errors: [
        {
          message: e.toString()
        }
      ]
    };
  }
};

/**
 * Verifies storage access credentials to make sure storage account and table is accessible
 * @param storageAccountName storage account name
 * @param storageAccountKey storage access key
 * @param storageTableName storage table name
 * @param storagePartitionKey storage partition key name
 */
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

/**
 * Validates that pipeline is accessible using pipeline personal access token
 * @param org Azure DevOps organization name
 * @param project Azure DevOps project name
 * @param pat Azure DevOps pipeline access token
 */
export const verifyPipeline = async (
  org: string,
  project: string,
  pat: string
): Promise<IValidationError | undefined> => {
  try {
    if (org === "" || project === "") {
      throw new Error("Organization and/or project name are not defined");
    }
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

/**
 * Validates that manifest repo is accessible for fetching cluster sync statuses
 * @param repoName repository name
 * @param pat personal access token for manifest repo
 * @param org Azure DevOps organization name
 * @param project Azure DevOps project name
 * @param githubUsername GitHub organization or username for the manifest
 * repository, eg. for github.com/microsoft/bedrock.git, this would be "microsoft"
 */
export const verifyManifestRepo = async (
  repoName: string,
  pat: string,
  org: string,
  project: string,
  githubUsername?: string
): Promise<IValidationError | undefined> => {
  try {
    if (githubUsername) {
      await getGitHubClusterSync(
        {
          reponame: repoName,
          username: githubUsername
        },
        pat
      );
      return undefined;
    } else if (repoName) {
      await getADOClusterSync(
        {
          org,
          project,
          repo: repoName
        },
        pat
      );
      return undefined;
    } else {
      return {
        message: "Manifest repository could not be recognized."
      };
    }
  } catch (err) {
    return {
      message:
        "Failed to verify manifest repo for cluster sync status. " +
        err.toString()
    };
  }
};

/**
 * Creates an instance of Azure DevOps pipeline
 * @param org Azure DevOps organization name
 * @param project Azure DevOps project name
 * @param token Azure DevOps personal access token
 */
export const createPipeline = (
  org: string,
  project: string,
  token?: string
) => {
  return new AzureDevOpsPipeline(org, project, token);
};

/**
 * Verifies that source repo information is accessible using the source repo access token.
 * This is used for fetching author data
 * @param storageAccountName storage account name
 * @param storageAccountKey storage access key
 * @param storageTableName storage table name
 * @param storagePartitionKey storage partition key name
 * @param sourceRepoAccessToken source repo access token
 * @param srcPipeline source pipeline
 * @param hldPipeline hld pipeline
 * @param manifestPipeline manifest pipeline
 */
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
        const author: IAuthor | undefined = await fetchAuthor(
          repo,
          commit,
          sourceRepoAccessToken
        );
        if (author) {
          return undefined;
        }
      }
    }

    return {
      message:
        "Source repo access could not be verified. Either the table is missing sufficient data to verify, or data is invalid in storage."
    };
  } catch (e) {
    return {
      message:
        "Error occurred while verifying source repo access. " + e.toString()
    };
  }
};
