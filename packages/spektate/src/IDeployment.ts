import * as azure from "azure-storage";
import { copy, IBuild } from "./pipeline/Build";
import IPipeline from "./pipeline/Pipeline";
import { IPipelineStages } from "./pipeline/PipelineStage";
import { IRelease } from "./pipeline/Release";
import { IAuthor } from "./repository/Author";
import {
  getAuthor as adoGetAuthor,
  getPullRequest as adoGetPR,
  IAzureDevOpsRepo
} from "./repository/IAzureDevOpsRepo";
import {
  getAuthor as gitHubGetAuthor,
  getPullRequest as githubGetPR,
  IGitHub
} from "./repository/IGitHub";
import { IPullRequest } from "./repository/IPullRequest";

export interface IDeployment {
  deploymentId: string;
  srcToDockerBuild?: IBuild;
  dockerToHldRelease?: IRelease;
  dockerToHldReleaseStage?: IBuild;
  hldToManifestBuild?: IBuild;
  commitId: string;
  hldCommitId?: string;
  imageTag: string;
  timeStamp: string;
  manifestCommitId?: string;
  author?: IAuthor;
  environment: string;
  service: string;
  duration?: string;
  status?: string;
  endTime?: Date;
  pr?: number;
  sourceRepo?: string;
  hldRepo?: string;
  manifestRepo?: string;
}

export const getDeploymentsBasedOnFilters = async (
  storageAccount: string,
  storageAccountKey: string,
  storageTableName: string,
  partitionKey: string,
  srcPipeline: IPipeline,
  hldPipeline: IPipeline,
  manifestPipeline: IPipeline,
  environment?: string,
  imageTag?: string,
  p1Id?: string,
  commitId?: string,
  service?: string,
  deploymentId?: string
): Promise<IDeployment[]> => {
  const query = new azure.TableQuery().where(
    "PartitionKey eq '" + partitionKey + "'"
  );
  if (environment && environment !== "") {
    query.and("env eq '" + environment.toLowerCase() + "'");
  }
  if (imageTag && imageTag !== "") {
    query.and("imageTag eq '" + imageTag.toLowerCase() + "'");
  }
  if (p1Id && p1Id !== "") {
    query.and("p1 eq '" + p1Id.toLowerCase() + "'");
  }
  if (commitId && commitId !== "") {
    query.and("commitId eq '" + commitId.toLowerCase() + "'");
  }
  if (service && service !== "") {
    query.and("service eq '" + service.toLowerCase() + "'");
  }
  if (deploymentId && deploymentId !== "") {
    query.and("RowKey eq '" + deploymentId.toLowerCase() + "'");
  }

  return await getDeployments(
    storageAccount,
    storageAccountKey,
    storageTableName,
    partitionKey,
    srcPipeline,
    hldPipeline,
    manifestPipeline,
    query
  );
};

export const getDeployments = async (
  storageAccount: string,
  storageAccountKey: string,
  storageTableName: string,
  partitionKey: string,
  srcPipeline: IPipeline,
  hldPipeline: IPipeline,
  manifestPipeline: IPipeline,
  query?: azure.TableQuery
): Promise<IDeployment[]> => {
  const tableService = azure.createTableService(
    storageAccount,
    storageAccountKey
  );
  // Disabling ts-lint on line below, to get around issue https://github.com/Azure/azure-storage-node/issues/545
  // tslint:disable-next-line
  let nextContinuationToken: azure.TableService.TableContinuationToken = <any>(
    null
  );

  if (!query) {
    query = new azure.TableQuery().where(
      "PartitionKey eq '" + partitionKey + "'"
    );
  }

  return new Promise<IDeployment[]>((resolve, reject) => {
    tableService.queryEntities(
      storageTableName,
      query!,
      nextContinuationToken,
      (error: any, result: any) => {
        if (error) {
          if (error.code === "AuthenticationFailed") {
            reject(
              `Authentication failed for storage account '${storageAccount}'.`
            );
          } else {
            reject(error.message);
          }
        } else {
          parseDeploymentsFromDB(
            result,
            srcPipeline,
            hldPipeline,
            manifestPipeline,
            storageAccount,
            storageAccountKey,
            storageTableName,
            resolve
          );
        }
      }
    );
  });
};

export const compare = (a: IDeployment, b: IDeployment): number => {
  const aInt = endTime(a).getTime();
  const bInt = endTime(b).getTime();
  return aInt < bInt ? 1 : -1;
};

export const parseDeploymentsFromDB = (
  result: any,
  srcPipeline: IPipeline,
  hldPipeline: IPipeline,
  manifestPipeline: IPipeline,
  storageAccount: string,
  storageAccountKey: string,
  storageTableName: string,
  resolve: (
    value?: IDeployment[] | PromiseLike<IDeployment[]> | undefined
  ) => void
) => {
  const deployments: IDeployment[] = [];
  const srcBuildIds: Set<string> = new Set<string>();
  const manifestBuildIds: Set<string> = new Set<string>();
  const releaseIds: Set<string> = new Set<string>();

  for (const entry of result.entries) {
    if (entry.p1) {
      srcBuildIds.add(entry.p1._);
    }
    if (entry.p3) {
      manifestBuildIds.add(entry.p3._);
    }
    if (entry.p2 && (!entry.p1 || entry.p1._ !== entry.p2._)) {
      // Assumption: build pipelines are multi stage if the ids of p1 and p2 are the same
      releaseIds.add(entry.p2._);
    }
  }

  const p1 = srcPipeline.getListOfBuilds(srcBuildIds);
  const p2 = hldPipeline.getListOfReleases(releaseIds);
  const p3 = manifestPipeline.getListOfBuilds(manifestBuildIds);

  // Wait for all three pipelines to load their respective builds before we instantiate deployments
  Promise.all([p1, p2, p3])
    .then(async () => {
      const batch = new azure.TableBatch();
      for (const entry of result.entries) {
        const dep = await getDeploymentFromDBEntry(
          entry,
          srcPipeline,
          hldPipeline,
          manifestPipeline
        );
        if (
          dep.srcToDockerBuild ||
          dep.dockerToHldRelease ||
          dep.hldToManifestBuild ||
          dep.dockerToHldReleaseStage
        ) {
          deployments.push(dep);
        } else {
          // Remove this deployment from db since its builds/releases have expired
          batch.deleteEntity(entry);
        }
      }
      deployments.sort(compare);
      resolve(deployments);
      cleanUpDeploymentsFromDB(
        batch,
        storageAccount,
        storageAccountKey,
        storageTableName
      );
    })
    .catch(err => {
      console.error(err);
      resolve([]);
    });
};

export const cleanUpDeploymentsFromDB = (
  batch: azure.TableBatch,
  storageAccount: string,
  storageAccountKey: string,
  storageAccountTable: string
) => {
  if (batch.size() > 0) {
    const tableService = azure.createTableService(
      storageAccount,
      storageAccountKey
    );
    tableService.executeBatch(storageAccountTable, batch, (error, result) => {
      if (error) {
        console.error("Failed to clean up db: ", error);
      }
    });
  }
};

// TODO: Look into cleaning up the parsing code below (avoid parsing underscores).
export const getDeploymentFromDBEntry = async (
  entry: any,
  srcPipeline: IPipeline,
  hldPipeline: IPipeline,
  manifestPipeline: IPipeline
) => {
  let p1: IBuild | undefined;
  let imageTag = "";
  let commitId = "";
  if (entry.p1 != null) {
    p1 = srcPipeline.builds[entry.p1._];
  }
  if (entry.commitId != null) {
    commitId = entry.commitId._;
  }
  if (entry.imageTag != null) {
    imageTag = entry.imageTag._;
  }

  let p2: IRelease | undefined;
  let p2ReleaseStage: IBuild | undefined;
  let hldCommitId = "";
  let manifestCommitId = "";
  let env = "";
  let service = "";
  const promises = [];
  if (entry.p2 != null) {
    if (
      entry.p1 &&
      entry.p1._ === entry.p2._ &&
      srcPipeline.builds[entry.p2._]
    ) {
      p2ReleaseStage = copy(srcPipeline.builds[entry.p2._]);
      // Make the call for details only when the overall pipeline has failed
      if (p2ReleaseStage && p2ReleaseStage.result !== "succeeded") {
        const promise = srcPipeline
          .getBuildStages(p2ReleaseStage)
          .then((stages: IPipelineStages) => {
            if (stages && p2ReleaseStage) {
              if (p1 && stages[1]) {
                p1.result = stages[1].result;
                p1.status = stages[1].state;
              }
              if (stages[2]) {
                p2ReleaseStage.result = stages[2].result;
                p2ReleaseStage.status = stages[2].state;
              }
            }
          });
        promises.push(promise);
      }
    } else if (entry.p1 == null || entry.p1 !== entry.p2) {
      p2 = hldPipeline.releases[entry.p2._];
    }
  }

  let p3: IBuild | undefined;
  if (entry.p3 != null) {
    p3 = manifestPipeline.builds[entry.p3._];
  }
  if (entry.hldCommitId != null) {
    hldCommitId = entry.hldCommitId._;
  }
  if (entry.manifestCommitId != null) {
    manifestCommitId = entry.manifestCommitId._;
  }

  if (entry.env != null) {
    env = entry.env._;
  }
  if (entry.service != null) {
    service = entry.service._;
    if (service.split("/").length === 2) {
      service = service.split("/")[1];
    }
  }
  await Promise.all(promises);
  const deployment: IDeployment = {
    commitId,
    deploymentId: entry.RowKey._,
    dockerToHldRelease: p2,
    dockerToHldReleaseStage: p2ReleaseStage,
    environment: env,
    hldCommitId,
    hldRepo: entry.hldRepo ? entry.hldRepo._ : undefined,
    hldToManifestBuild: p3,
    imageTag,
    manifestCommitId,
    manifestRepo: entry.manifestRepo ? entry.manifestRepo._ : undefined,
    pr: entry.pr ? entry.pr._ : undefined,
    service,
    sourceRepo: entry.sourceRepo ? entry.sourceRepo._ : undefined,
    srcToDockerBuild: p1,
    timeStamp: entry.Timestamp._
  };
  deployment.status = status(deployment);
  deployment.endTime = endTime(deployment);
  deployment.duration = duration(deployment);
  return deployment;
};

export const duration = (deployment: IDeployment): string => {
  let durationInMins = 0;
  if (deployment.srcToDockerBuild != null) {
    durationInMins =
      (Number.isNaN(deployment.srcToDockerBuild.finishTime.valueOf())
        ? Date.now().valueOf()
        : deployment.srcToDockerBuild.finishTime.valueOf()) -
      deployment.srcToDockerBuild.queueTime.valueOf();
  }
  if (deployment.dockerToHldRelease != null) {
    durationInMins +=
      (Number.isNaN(deployment.dockerToHldRelease.finishTime.valueOf())
        ? Date.now().valueOf()
        : deployment.dockerToHldRelease.finishTime.valueOf()) -
      deployment.dockerToHldRelease.queueTime.valueOf();
  }
  if (deployment.hldToManifestBuild != null) {
    durationInMins +=
      (Number.isNaN(deployment.hldToManifestBuild.finishTime.valueOf())
        ? Date.now().valueOf()
        : deployment.hldToManifestBuild.finishTime.valueOf()) -
      deployment.hldToManifestBuild.queueTime.valueOf();
  }
  if (deployment.dockerToHldReleaseStage != null) {
    durationInMins =
      (Number.isNaN(deployment.dockerToHldReleaseStage.finishTime.valueOf())
        ? Date.now().valueOf()
        : deployment.dockerToHldReleaseStage.finishTime.valueOf()) -
      deployment.dockerToHldReleaseStage.queueTime.valueOf();
  }

  return Number(durationInMins / 60000).toFixed(2);
};

export const endTime = (deployment: IDeployment): Date => {
  return (
    extractLastUpdateTime(deployment.hldToManifestBuild) ||
    extractLastUpdateTime(deployment.dockerToHldRelease) ||
    extractLastUpdateTime(deployment.dockerToHldReleaseStage) ||
    extractLastUpdateTime(deployment.srcToDockerBuild) ||
    new Date(Date.now())
  );
};

export const extractLastUpdateTime = (field: any): Date | undefined => {
  if (field && field.lastUpdateTime) {
    const date = new Date(field.lastUpdateTime);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
};

export const status = (deployment: IDeployment): string => {
  if (
    deployment.hldToManifestBuild &&
    deployment.hldToManifestBuild.status === "completed" &&
    deployment.hldToManifestBuild.result === "succeeded"
  ) {
    return "Complete";
  } else if (
    (deployment.srcToDockerBuild &&
      deployment.srcToDockerBuild.status === "inProgress") ||
    (deployment.dockerToHldRelease &&
      deployment.dockerToHldRelease.status === "inProgress") ||
    (deployment.dockerToHldReleaseStage &&
      deployment.dockerToHldReleaseStage.status === "inProgress") ||
    (deployment.hldToManifestBuild &&
      deployment.hldToManifestBuild.status === "inProgress")
  ) {
    return "In Progress";
  } else if (
    (deployment.srcToDockerBuild &&
      deployment.srcToDockerBuild.result === "failed") ||
    (deployment.dockerToHldReleaseStage &&
      deployment.dockerToHldReleaseStage.result === "failed") ||
    (deployment.hldToManifestBuild &&
      deployment.hldToManifestBuild.result === "failed")
  ) {
    return "failed";
  }
  return "Incomplete";
};

export const fetchAuthor = (
  repository: IGitHub | IAzureDevOpsRepo,
  commitId: string,
  accessToken?: string
): Promise<IAuthor | undefined> => {
  return new Promise((resolve, reject) => {
    if ("username" in repository) {
      gitHubGetAuthor(repository, commitId, accessToken)
        .then((author: IAuthor | undefined) => {
          resolve(author);
        })
        .catch(error => {
          reject(error);
        });
    } else if ("org" in repository) {
      adoGetAuthor(repository, commitId, accessToken)
        .then((author: IAuthor | undefined) => {
          resolve(author);
        })
        .catch(error => {
          reject(error);
        });
    }
  });
};

export const fetchPR = (
  repository: IGitHub | IAzureDevOpsRepo,
  prId: string,
  accessToken?: string
): Promise<IPullRequest | undefined> => {
  return new Promise((resolve, reject) => {
    if ("username" in repository) {
      githubGetPR(repository, prId, accessToken)
        .then((pr: IPullRequest | undefined) => {
          resolve(pr);
        })
        .catch(error => {
          reject(error);
        });
    } else if ("org" in repository) {
      adoGetPR(repository, prId, accessToken)
        .then((pr: IPullRequest | undefined) => {
          resolve(pr);
        })
        .catch(error => {
          reject(error);
        });
    } else {
      reject("Repository could not be recognized.");
    }
  });
};

export const getRepositoryFromURL = (
  repository: string
): IAzureDevOpsRepo | IGitHub | undefined => {
  repository = repository
    .replace("https://", "")
    .replace("http://", "")
    .toLowerCase();
  const repoSplit = repository.split("/");
  if (repository.includes("github")) {
    return {
      reponame: repoSplit[repoSplit.length - 1],
      username: repoSplit[repoSplit.length - 2]
    };
  } else if (repository.includes("azure")) {
    return {
      org: repoSplit[1],
      project: repoSplit[2],
      repo: repoSplit[4]
    };
  }
};
