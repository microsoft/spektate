import * as azure from "azure-storage";
import { config } from "../config";
import { Build } from "./pipeline/Build";
import Pipeline from "./pipeline/Pipeline";
import { Release } from "./pipeline/Release";
import { Author } from "./repository/Author";

class Deployment {
  public static async getDeploymentsBasedOnFilters(
    partitionKey: string,
    srcPipeline: Pipeline,
    hldPipeline: Pipeline,
    manifestPipeline: Pipeline,
    environment?: string,
    imageTag?: string,
    p1Id?: string,
    commitId?: string,
    callback?: (deployments: Deployment[]) => void
  ) {
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

    await this.getDeployments(
      partitionKey,
      srcPipeline,
      hldPipeline,
      manifestPipeline,
      callback,
      query
    );
  }

  public static async getDeployments(
    partitionKey: string,
    srcPipeline: Pipeline,
    hldPipeline: Pipeline,
    manifestPipeline: Pipeline,
    callback?: (deployments: Deployment[]) => void,
    query?: azure.TableQuery
  ) {
    const tableService = azure.createTableService(
      config.STORAGE_ACCOUNT_NAME,
      config.STORAGE_ACCOUNT_KEY
    );
    // Disabling ts-lint on line below, to get around issue https://github.com/Azure/azure-storage-node/issues/545
    // tslint:disable-next-line
    let nextContinuationToken: azure.TableService.TableContinuationToken = <
      any
    >null;
    const deployments: Deployment[] = [];

    if (!query) {
      query = new azure.TableQuery().where(
        "PartitionKey eq '" + partitionKey + "'"
      );
    }

    tableService.queryEntities(
      config.STORAGE_TABLE_NAME,
      query,
      nextContinuationToken,
      (error: any, result: any) => {
        if (!error) {
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
            if (entry.p2) {
              releaseIds.add(entry.p2._);
            }
          }

          const p1 = srcPipeline.getListOfBuilds(undefined, srcBuildIds);
          // TODO: send releaseIds to below after bug in release API is fixed
          const p2 = hldPipeline.getListOfReleases(undefined, releaseIds);
          const p3 = manifestPipeline.getListOfBuilds(
            undefined,
            manifestBuildIds
          );

          // Wait for all three pipelines to load their respective builds before we instantiate deployments
          Promise.all([p1, p2, p3]).then(() => {
            // tslint:disable-next-line:no-console
            // console.log(result.entries);
            for (const entry of result.entries) {
              deployments.push(
                Deployment.getDeploymentFromDBEntry(
                  entry,
                  srcPipeline,
                  hldPipeline,
                  manifestPipeline
                )
              );
            }
            if (callback) {
              deployments.sort(Deployment.compare);
              callback(deployments);
            }
          });
        }
      }
    );
  }

  public static compare(a: Deployment, b: Deployment) {
    let aInt = 0;
    let bInt = 0;
    if (a.srcToDockerBuild != null && b.srcToDockerBuild != null) {
      aInt = Number(a.srcToDockerBuild.id);
      bInt = Number(b.srcToDockerBuild.id);
      if (aInt < bInt) {
        return 1;
      } else if (aInt > bInt) {
        return -1;
      }
    }
    if (a.dockerToHldRelease != null && b.dockerToHldRelease != null) {
      aInt = Number(a.dockerToHldRelease.id);
      bInt = Number(b.dockerToHldRelease.id);
      if (aInt < bInt) {
        return 1;
      } else if (aInt > bInt) {
        return -1;
      }
    }

    if (a.hldToManifestBuild != null && b.hldToManifestBuild != null) {
      aInt = Number(a.hldToManifestBuild.id);
      bInt = Number(b.hldToManifestBuild.id);
      if (aInt < bInt) {
        return 1;
      } else if (aInt > bInt) {
        return -1;
      }
    }

    return 0;
  }

  // TODO: Look into cleaning up the parsing code below (avoid parsing underscores).
  private static getDeploymentFromDBEntry = (
    entry: any,
    srcPipeline: Pipeline,
    hldPipeline: Pipeline,
    manifestPipeline: Pipeline
  ) => {
    let p1;
    let imageTag = "";
    let commitId = "";
    if (entry.p1 != null) {
      p1 = srcPipeline.builds[entry.p1._];
      if (entry.commitId != null) {
        commitId = entry.commitId._;
      }
      if (entry.imageTag != null) {
        imageTag = entry.imageTag._;
      }
    }

    let p2;
    let hldCommitId = "";
    let manifestCommitId = "";
    let env = "";
    let service = "";
    if (entry.p2 != null) {
      p2 = hldPipeline.releases[entry.p2._];
    }
    let p3;
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
    }

    const deployment = new Deployment(
      entry.RowKey._,
      commitId,
      hldCommitId,
      imageTag,
      entry.Timestamp._,
      env,
      service,
      manifestCommitId,
      p1,
      p2,
      p3
    );
    return deployment;
  };

  public deploymentId: string;
  public srcToDockerBuild?: Build;
  public dockerToHldRelease?: Release;
  public hldToManifestBuild?: Build;
  public commitId: string;
  public hldCommitId?: string;
  public imageTag: string;
  public timeStamp: string;
  public manifestCommitId?: string;
  public author?: Author;
  public environment: string;
  public service: string;

  constructor(
    deploymentId: string,
    commitId: string,
    hldCommitId: string,
    imageTag: string,
    timeStamp: string,
    environment: string,
    service: string,
    manifestCommitId?: string,
    srcToDockerBuild?: Build,
    dockerToHldRelease?: Release,
    hldToManifestBuild?: Build
  ) {
    this.srcToDockerBuild = srcToDockerBuild;
    this.hldToManifestBuild = hldToManifestBuild;
    this.deploymentId = deploymentId;
    this.dockerToHldRelease = dockerToHldRelease;
    this.commitId = commitId;
    this.hldCommitId = hldCommitId;
    this.imageTag = imageTag;
    this.timeStamp = timeStamp;
    this.manifestCommitId = manifestCommitId;
    this.environment = environment;
    this.service = service;
  }

  public duration(): string {
    let duration = 0;
    if (this.srcToDockerBuild != null) {
      duration =
        (Number.isNaN(this.srcToDockerBuild.finishTime.valueOf())
          ? Date.now().valueOf()
          : this.srcToDockerBuild.finishTime.valueOf()) -
        this.srcToDockerBuild.queueTime.valueOf();
    }
    if (this.dockerToHldRelease != null) {
      duration +=
        (Number.isNaN(this.dockerToHldRelease.finishTime.valueOf())
          ? Date.now().valueOf()
          : this.dockerToHldRelease.finishTime.valueOf()) -
        this.dockerToHldRelease.queueTime.valueOf();
    }
    if (this.hldToManifestBuild != null) {
      duration +=
        (Number.isNaN(this.hldToManifestBuild.finishTime.valueOf())
          ? Date.now().valueOf()
          : this.hldToManifestBuild.finishTime.valueOf()) -
        this.hldToManifestBuild.queueTime.valueOf();
    }

    return Number(duration / 60000).toFixed(2);
  }

  public status(): string {
    if (
      (this.srcToDockerBuild
        ? this.srcToDockerBuild.status === "completed"
        : false) &&
      (this.hldToManifestBuild
        ? this.hldToManifestBuild.status === "completed"
        : false) &&
      (this.dockerToHldRelease
        ? this.dockerToHldRelease.status === "succeeded" ||
          this.dockerToHldRelease.status === "failed"
        : false)
    ) {
      return "Complete";
    }
    return "In Progress";
  }

  public fetchAuthor(callback: (author: Author) => void): void {
    if (this.srcToDockerBuild && this.srcToDockerBuild.repository) {
      this.srcToDockerBuild.repository.getAuthor(
        this.srcToDockerBuild.sourceVersion,
        callback
      );
    }
  }
}

export default Deployment;
