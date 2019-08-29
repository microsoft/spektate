import { config } from "../../config";
import { HttpHelper } from "../HttpHelper";
import { AzureDevOpsRepo } from "../repository/AzureDevOpsRepo";
import { GitHub } from "../repository/GitHub";
import { Build } from "./Build";
import Pipeline from "./Pipeline";
import { Release } from "./Release";

const buildFilterUrl =
  "https://dev.azure.com/{organization}/{project}/_apis/build/builds?buildIds={buildIds}&api-version=5.0";
const baseBuildUrl =
  "https://dev.azure.com/{organization}/{project}/_apis/build/builds?&api-version=5.0&queryOrder=startTimeDescending";
const baseReleaseUrl =
  "https://vsrm.dev.azure.com/{organization}/{project}/_apis/release/deployments?api-version=5.0&queryOrder=startTimeDescending";
const releaseFilterUrl =
  "https://vsrm.dev.azure.com/{organization}/{project}/_apis/release/deployments?api-version=5.0&releaseIdFilter={releaseIds}&queryOrder=startTimeDescending";

class AzureDevOpsPipeline extends Pipeline {
  // User defined fields
  public org: string;
  public project: string;
  public isRelease?: boolean;
  public accessToken?: string;

  constructor(
    org: string,
    project: string,
    isRelease?: boolean,
    accessToken?: string
  ) {
    super();
    this.org = org;
    this.project = project;
    this.isRelease = isRelease;
    this.accessToken = accessToken;
  }

  public async getListOfBuilds(buildIds?: Set<string>): Promise<void> {
    const buildUrl = this.getBuildUrl(buildIds);
    return new Promise((resolve, reject) => {
      HttpHelper.httpGet(
        buildUrl,
        json => {
          const builds: Build[] = [];
          for (const row of json.data.value) {
            const build = new Build();
            build.author = row.requestedFor.displayName;
            build.buildNumber = row.buildNumber;
            build.id = row.id;
            build.queueTime = new Date(row.queueTime);
            build.sourceBranch = row.sourceBranch;
            build.status = row.status;
            build.startTime = new Date(row.startTime);
            build.URL = row._links.web.href;
            build.result = row.result;
            build.sourceVersion = row.sourceVersion;
            build.sourceVersionURL = row._links.sourceVersionDisplayUri.href;
            build.finishTime = new Date(row.finishTime);
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
          resolve();
        },
        this.accessToken
      );
    });
  }

  // TODO: Once the bug with release API is fixed (regarding returning only top 50 rows),
  // improve the code below, and use the variable releaseIds
  public async getListOfReleases(releaseIds?: Set<string>): Promise<void> {
    return new Promise((resolve, reject) => {
      HttpHelper.httpGet(
        this.getReleaseUrl(releaseIds),
        json => {
          const releases: Release[] = [];
          for (const row of json.data.value) {
            const release = new Release();
            release.id = row.release.id;
            release.queueTime = new Date(row.queuedOn);
            release.startTime = new Date(row.startedOn);
            release.finishTime = new Date(row.completedOn);
            release.status = row.deploymentStatus;
            release.URL = row.release._links.web.href;
            release.releaseName = row.release.name;
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
          resolve();
        },
        this.accessToken
      );
    });
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
