import { config } from "../../config";
import { HttpHelper } from "../HttpHelper";
import { AzureDevOpsRepo } from "../repository/AzureDevOpsRepo";
import { GitHub } from "../repository/GitHub";
import { IBuild } from "./Build";
import IPipeline from "./Pipeline";
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
  public accessToken?: string;
  public builds = {};
  public releases = {};

  constructor(
    org: string,
    project: string,
    isRelease?: boolean,
    accessToken?: string
  ) {
    this.org = org;
    this.project = project;
    this.isRelease = isRelease;
    this.accessToken = accessToken;
  }

  public async getListOfBuilds(buildIds?: Set<string>) {
    const buildUrl = this.getBuildUrl(buildIds);
    const json = await HttpHelper.httpGet<any>(buildUrl, this.accessToken);

    const builds: IBuild[] = [];
    for (const row of json.data.value) {
      const build: IBuild = {
        URL: row._links.web.href,
        author: row.requestedFor.displayName,
        buildNumber: row.buildNumber,
        finishTime: new Date(row.finishTime),
        id: row.id,
        queueTime: new Date(row.queueTime),
        result: row.result,
        sourceBranch: row.sourceBranch,
        sourceVersion: row.sourceVersion,
        sourceVersionURL: row._links.sourceVersionDisplayUri.href,
        startTime: new Date(row.startTime),
        status: row.status
      };
      if (row.repository.type === "GitHub") {
        build.repository = new GitHub(
          row.repository.id.split("/")[0],
          row.repository.id.split("/")[1],
          config.MANIFEST_ACCESS_TOKEN
        );
      } else if (row.repository.type === "TfsGit") {
        const reposityUrlSplit = row.repository.url.split("/");
        build.repository = new AzureDevOpsRepo(
          reposityUrlSplit[3],
          reposityUrlSplit[4],
          reposityUrlSplit[6],
          config.MANIFEST_ACCESS_TOKEN
        );
      }
      builds.push(build);
      this.builds[build.id] = build;
    }
    return this.builds;
  }

  // TODO: Once the bug with release API is fixed (regarding returning only top 50 rows),
  // improve the code below, and use the variable releaseIds
  public async getListOfReleases(releaseIds?: Set<string>) {
    const json = await HttpHelper.httpGet<any>(
      this.getReleaseUrl(releaseIds),
      this.accessToken
    );

    const releases: IRelease[] = [];
    for (const row of json.data.value) {
      const release: IRelease = {
        URL: row.release._links.web.href,
        finishTime: new Date(row.completedOn),
        id: row.release.id,
        queueTime: new Date(row.queuedOn),
        releaseName: row.release.name,
        startTime: new Date(row.startedOn),
        status: row.deploymentStatus
      };
      if (row.release.artifacts.length > 0) {
        release.imageVersion =
          row.release.artifacts[0].definitionReference.version.id;
        release.registryURL =
          row.release.artifacts[0].definitionReference.registryurl.id;
        release.registryResourceGroup =
          row.release.artifacts[0].definitionReference.resourcegroup.id;
      }
      releases.push(release);
      this.releases[release.id] = release;
    }

    return this.releases;
  }

  private getBuildUrl(buildIds?: Set<string>) {
    if (buildIds) {
      let strBuildIds = "";
      buildIds.forEach(buildId => {
        strBuildIds += buildId + ",";
      });
      return buildFilterUrl
        .replace("{buildIds}", strBuildIds)
        .replace("{organization}", this.org)
        .replace("{project}", this.project);
    }

    return baseBuildUrl
      .replace("{organization}", this.org)
      .replace("{project}", this.project);
  }
  private getReleaseUrl(releaseIds?: Set<string>) {
    if (releaseIds) {
      let strBuildIds = "";
      releaseIds.forEach(releaseId => {
        strBuildIds += releaseId + ",";
      });
      return releaseFilterUrl
        .replace("{releaseIds}", strBuildIds)
        .replace("{organization}", this.org)
        .replace("{project}", this.project);
    }

    return baseReleaseUrl
      .replace("{organization}", this.org)
      .replace("{project}", this.project);
  }
}

export default AzureDevOpsPipeline;
