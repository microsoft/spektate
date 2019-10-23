import * as azure from "azure-storage";
import { IBuild } from "./pipeline/Build";
import IPipeline from "./pipeline/Pipeline";
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
              if (entry.p2) {
                releaseIds.add(entry.p2._);
              }
            }

            const p1 = srcPipeline.getListOfBuilds(srcBuildIds);
            const p2 = hldPipeline.getListOfReleases(releaseIds);
            const p3 = manifestPipeline.getListOfBuilds(manifestBuildIds);

            // Wait for all three pipelines to load their respective builds before we instantiate deployments
            Promise.all([p1, p2, p3])
              .then(() => {
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

    aInt = Math.max(
      Deployment.getLastUpdateTime(a.srcToDockerBuild),
      Deployment.getLastUpdateTime(undefined, a.dockerToHldRelease),
      Deployment.getLastUpdateTime(a.hldToManifestBuild)
    );
    bInt = Math.max(
      Deployment.getLastUpdateTime(b.srcToDockerBuild),
      Deployment.getLastUpdateTime(undefined, b.dockerToHldRelease),
      Deployment.getLastUpdateTime(b.hldToManifestBuild)
    );
    if (aInt < bInt) {
      return 1;
    }
    return -1;
  }

  private static getLastUpdateTime = (
    build: IBuild | undefined,
    release?: IRelease | undefined
  ): number => {
    if (build) {
      return Math.max(
        build.finishTime.getTime(),
        build.queueTime.getTime(),
        build.startTime.getTime()
      );
    }
    if (release) {
      return Math.max(
        release.finishTime.getTime(),
        release.queueTime.getTime(),
        release.startTime.getTime()
      );
    }
    return 0;
  };

  // TODO: Look into cleaning up the parsing code below (avoid parsing underscores).
  private static getDeploymentFromDBEntry = (
    entry: any,
    srcPipeline: IPipeline,
    hldPipeline: IPipeline,
    manifestPipeline: IPipeline
  ) => {
    let p1;
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
      if (service.split("/").length === 2) {
        service = service.split("/")[1];
      }
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
  public srcToDockerBuild?: IBuild;
  public dockerToHldRelease?: IRelease;
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
    hldToManifestBuild?: IBuild
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

  public fetchAuthor(callback: (author: IAuthor | undefined) => void): void {
    if (this.srcToDockerBuild && this.srcToDockerBuild.repository) {
      this.srcToDockerBuild.repository
        .getAuthor(this.srcToDockerBuild.sourceVersion)
        .then(callback);
    }
  }
}

export default Deployment;
