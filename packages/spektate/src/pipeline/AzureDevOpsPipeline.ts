import { HttpHelper } from "../HttpHelper";
import { IBuild } from "./Build";
import { IBuilds, IPipeline, IReleases } from "./Pipeline";
import { IPipelineStage, IPipelineStages } from "./PipelineStage";
import { IRelease } from "./Release";

const buildFilterUrl =
  "https://dev.azure.com/{organization}/{project}/_apis/build/builds?buildIds={buildIds}&api-version=5.0";
const baseBuildUrl =
  "https://dev.azure.com/{organization}/{project}/_apis/build/builds?&api-version=5.0&queryOrder=startTimeDescending";
const baseReleaseUrl =
  "https://vsrm.dev.azure.com/{organization}/{project}/_apis/release/deployments?api-version=5.0&queryOrder=startTimeDescending";
const releaseFilterUrl =
  "https://vsrm.dev.azure.com/{organization}/{project}/_apis/release/deployments?api-version=5.0&releaseIdFilter={releaseIds}&queryOrder=startTimeDescending";

export class AzureDevOpsPipeline implements IPipeline {
  // User defined fields
  public org: string;
  public project: string;
  public isRelease?: boolean;
  public pipelineAccessToken?: string;
  public builds: IBuilds = {};
  public releases: IReleases = {};

  constructor(
    org: string,
    project: string,
    isRelease?: boolean,
    pipelineAccessToken?: string
  ) {
    this.org = org;
    this.project = project;
    this.isRelease = isRelease;
    this.pipelineAccessToken = pipelineAccessToken;
  }

  public async getListOfBuilds(buildIds?: Set<string>): Promise<IBuilds> {
    if (buildIds && buildIds!.size === 0) {
      return this.builds;
    }
    const buildUrl = this.getBuildUrl(buildIds);
    const json = await HttpHelper.httpGet<any>(
      buildUrl,
      this.pipelineAccessToken
    );

    const builds: IBuild[] = [];
    for (const row of json.data.value) {
      const build: IBuild = {
        URL: row._links.web.href,
        author: row.requestedFor.displayName,
        buildNumber: row.buildNumber,
        finishTime: new Date(row.finishTime),
        id: row.id,
        lastUpdateTime: new Date(row.lastChangedDate),
        queueTime: new Date(row.queueTime),
        result: row.result,
        sourceBranch: row.sourceBranch,
        sourceVersion: row.sourceVersion,
        sourceVersionURL: row._links.sourceVersionDisplayUri.href,
        startTime: new Date(row.startTime),
        status: row.status,
        timelineURL: row._links.timeline.href
      };

      const lcType = row.repository.type.toLowerCase();

      if (lcType === "github") {
        const idSplit = row.repository.id.split("/");
        build.repository = {
          reponame: idSplit[1],
          username: idSplit[0]
        };
      } else if (lcType === "tfsgit" && row.repository.url) {
        const reposityUrlSplit = row.repository.url.split("/");
        build.sourceVersionURL =
          row.repository.url + "/commit/" + row.sourceVersion;
        build.repository = {
          org: reposityUrlSplit[3],
          project: reposityUrlSplit[4],
          repo: reposityUrlSplit[6]
        };
      }
      builds.push(build);

      this.builds[build.id] = build;
    }
    return this.builds;
  }

  /**
   * Gets the pipeline stages of the corresponding build
   * @param build The build to query for pipeline stages
   */
  public async getBuildStages(build: IBuild): Promise<IPipelineStages> {
    const json = await HttpHelper.httpGet<any>(
      build.timelineURL,
      this.pipelineAccessToken
    );

    build.stages = {};

    if (json.data && json.data.records.length === 0) {
      return build.stages;
    }

    for (const record of json.data.records) {
      let recordType: string = record.type;
      recordType = recordType.toLowerCase();

      if (recordType === "stage") {
        const stage: IPipelineStage = {
          id: record.id,
          name: record.name,
          order: record.order,
          result: record.result,
          state: record.state
        };

        build.stages[stage.order] = stage;
      }
    }

    return build.stages;
  }

  // TODO: Once the bug with release API is fixed (regarding returning only top 50 rows),
  // improve the code below, and use the variable releaseIds
  public async getListOfReleases(releaseIds?: Set<string>): Promise<IReleases> {
    if (releaseIds && releaseIds!.size === 0) {
      return this.releases;
    }
    const json = await HttpHelper.httpGet<any>(
      this.getReleaseUrl(releaseIds),
      this.pipelineAccessToken
    );

    const releases: IRelease[] = [];
    for (const row of json.data.value) {
      const release: IRelease = {
        URL: row.release._links.web.href,
        finishTime: new Date(row.completedOn),
        id: row.release.id,
        lastUpdateTime: new Date(row.lastModifiedOn),
        queueTime: new Date(row.queuedOn),
        releaseName: row.release.name,
        startTime: new Date(row.startedOn),
        status: row.deploymentStatus
      };

      if (row.release.artifacts.length > 0) {
        const defRef = row.release.artifacts[0].definitionReference;
        release.imageVersion = defRef.version.id;

        if (defRef.registryurl) {
          release.registryURL = defRef.registryurl.id;
        }
        if (defRef.resourcegroup) {
          release.registryResourceGroup = defRef.resourcegroup.id;
        }
      }
      releases.push(release);
      this.releases[release.id] = release;
    }

    return this.releases;
  }

  private getBuildUrl(buildIds?: Set<string>): string {
    if (buildIds) {
      const strBuildIds = Array.from(buildIds.values()).join(",");
      return buildFilterUrl
        .replace("{buildIds}", strBuildIds)
        .replace("{organization}", this.org)
        .replace("{project}", this.project);
    }

    return baseBuildUrl
      .replace("{organization}", this.org)
      .replace("{project}", this.project);
  }
  private getReleaseUrl(releaseIds?: Set<string>): string {
    if (releaseIds) {
      const strReleaseIds = Array.from(releaseIds.values()).join(",");
      return releaseFilterUrl
        .replace("{releaseIds}", strReleaseIds)
        .replace("{organization}", this.org)
        .replace("{project}", this.project);
    }

    return baseReleaseUrl
      .replace("{organization}", this.org)
      .replace("{project}", this.project);
  }
}

export default AzureDevOpsPipeline;
