import * as azure from "azure-storage";
import { copy, IBuild } from "./pipeline/Build";
import IPipeline from "./pipeline/Pipeline";
import { IPipelineStages } from "./pipeline/PipelineStage";
import { IRelease } from "./pipeline/Release";
import { IAuthor } from "./repository/Author";

class Deployment {
  public static async getDeploymentsBasedOnFilters(
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
  ): Promise<Deployment[]> {
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

    return await this.getDeployments(
      storageAccount,
      storageAccountKey,
      storageTableName,
      partitionKey,
      srcPipeline,
      hldPipeline,
      manifestPipeline,
      query
    );
  }

  public static async getDeployments(
    storageAccount: string,
    storageAccountKey: string,
    storageTableName: string,
    partitionKey: string,
    srcPipeline: IPipeline,
    hldPipeline: IPipeline,
    manifestPipeline: IPipeline,
    query?: azure.TableQuery
  ): Promise<Deployment[]> {
    const tableService = azure.createTableService(
      storageAccount,
      storageAccountKey
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

    return new Promise<Deployment[]>(resolve => {
      tableService.queryEntities(
        storageTableName,
        query!,
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
                for (const entry of result.entries) {
                  const dep = await Deployment.getDeploymentFromDBEntry(
                    entry,
                    srcPipeline,
                    hldPipeline,
                    manifestPipeline
                  );
                  if (
                    dep.srcToDockerBuild ||
                    dep.dockerToHldRelease ||
                    dep.hldToManifestBuild
                  ) {
                    deployments.push(dep);
                  }
                }
                deployments.sort(Deployment.compare);
                resolve(deployments);
              })
              .catch(_ => {
                resolve([]);
              });
          }
        }
      );
    });
  }

  public static compare(a: Deployment, b: Deployment) {
    let aInt = 0;
    let bInt = 0;

    aInt = a.endTime().getTime();
    bInt = b.endTime().getTime();
    if (aInt < bInt) {
      return 1;
    }
    return -1;
  }

  // TODO: Look into cleaning up the parsing code below (avoid parsing underscores).
  private static getDeploymentFromDBEntry = async (
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
      if (entry.p1 && entry.p1._ === entry.p2._) {
        p2ReleaseStage = copy(srcPipeline.builds[entry.p2._]);
        // Make the call for details only when the overall pipeline has failed
        if (p2ReleaseStage.result !== "succeeded") {
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
      p3,
      p2ReleaseStage
    );
    return deployment;
  };

  public deploymentId: string;
  public srcToDockerBuild?: IBuild;
  public dockerToHldRelease?: IRelease;
  public dockerToHldReleaseStage?: IBuild;
  public hldToManifestBuild?: IBuild;
  public commitId: string;
  public hldCommitId?: string;
  public imageTag: string;
  public timeStamp: string;
  public manifestCommitId?: string;
  public author?: IAuthor;
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
    srcToDockerBuild?: IBuild,
    dockerToHldRelease?: IRelease,
    hldToManifestBuild?: IBuild,
    dockerToHldReleaseStage?: IBuild
  ) {
    this.srcToDockerBuild = srcToDockerBuild;
    this.hldToManifestBuild = hldToManifestBuild;
    this.deploymentId = deploymentId;
    this.dockerToHldRelease = dockerToHldRelease;
    this.dockerToHldReleaseStage = dockerToHldReleaseStage;
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
    if (this.dockerToHldReleaseStage != null) {
      duration =
        (Number.isNaN(this.dockerToHldReleaseStage.finishTime.valueOf())
          ? Date.now().valueOf()
          : this.dockerToHldReleaseStage.finishTime.valueOf()) -
        this.dockerToHldReleaseStage.queueTime.valueOf();
    }

    return Number(duration / 60000).toFixed(2);
  }

  public endTime = (): Date => {
    if (this.hldToManifestBuild && this.hldToManifestBuild.lastUpdateTime) {
      return this.hldToManifestBuild.lastUpdateTime;
    } else if (
      this.dockerToHldRelease &&
      this.dockerToHldRelease.lastUpdateTime
    ) {
      return this.dockerToHldRelease.lastUpdateTime;
    } else if (
      this.dockerToHldReleaseStage &&
      this.dockerToHldReleaseStage.lastUpdateTime
    ) {
      return this.dockerToHldReleaseStage.lastUpdateTime;
    } else if (this.srcToDockerBuild && this.srcToDockerBuild.lastUpdateTime) {
      return this.srcToDockerBuild.lastUpdateTime;
    }
    return new Date(Date.now());
  };

  public status(): string {
    if (
      (this.srcToDockerBuild &&
        this.srcToDockerBuild.status === "inProgress") ||
      (this.dockerToHldRelease &&
        this.dockerToHldRelease.status === "inProgress") ||
      (this.dockerToHldReleaseStage &&
        this.dockerToHldReleaseStage.status === "inProgress") ||
      (this.hldToManifestBuild &&
        this.hldToManifestBuild.status === "inProgress")
    ) {
      return "In Progress";
    } else if (
      this.srcToDockerBuild &&
      this.srcToDockerBuild.status === "completed" &&
      ((this.dockerToHldRelease &&
        this.dockerToHldRelease.status === "succeeded") ||
        (this.dockerToHldReleaseStage &&
          this.dockerToHldReleaseStage.status === "completed")) &&
      (this.hldToManifestBuild &&
        this.hldToManifestBuild.status === "completed")
    ) {
      return "Complete";
    }
    return "Incomplete";
  }

  public fetchAuthor(callback: (author: IAuthor | undefined) => void): void {
    if (this.srcToDockerBuild && this.srcToDockerBuild.repository) {
      this.srcToDockerBuild.repository
        .getAuthor(this.srcToDockerBuild.sourceVersion)
        .then(callback);
    }
  }
}

export default Deployment;
