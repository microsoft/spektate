import { HttpHelper } from "../HttpHelper";
import { IBuild } from "./Build";
import { IBuilds, IPipeline, IReleases } from "./Pipeline";
import { IPipelineStage, IPipelineStages } from "./PipelineStage";

const jobsUrl = "https://api.github.com/repos/{repository}/actions/jobs/{jobId}";
const shaUrl = "https://github.com/{repository}/commit/{commitId}";

export class GithubActions implements IPipeline {
  public builds: IBuilds = {};
  public releases: IReleases = {};
  public sourceRepo: string = "";
  public pipelineAccessToken?: string;

  constructor(sourceRepo: string, accessToken?: string) {
    this.sourceRepo = sourceRepo;
    this.pipelineAccessToken = accessToken;
  }

  public async getListOfBuilds(buildIds?: Set<string>): Promise<IBuilds> {
    const promises: Array<Promise<any>> = [];
    const evaluateData = (data: any) => {
      if (!data) {
        throw new Error(
          "Data could not be fetched from Github Actions. Please check the personal access token and repo names."
        );
      }
      const newBuild = {
        URL: data.html_url,
        author: "Unavailable",
        buildNumber: data.id,
        finishTime: new Date(data.completed_at),
        id: data.id,
        lastUpdateTime: new Date(data.started_at),
        queueTime: new Date(data.started_at),
        result: data.conclusion,
        sourceBranch: "sourceBranch",
        sourceVersion: data.head_sha,
        sourceVersionURL: shaUrl.replace("{repository}", this.sourceRepo).replace("{commitId}", data.head_sha),
        startTime: new Date(data.started_at),
        status: data.status,
        timelineURL: data.html_url
      };
      this.builds[data.id] = newBuild;
    }
    try {
      if (buildIds) {
        buildIds.forEach((buildId: string) => {
          if (buildId && buildId.trim() !== "") {
            promises.push(HttpHelper.httpGet(
              jobsUrl.replace("{repository}", this.sourceRepo).replace("{jobId}", buildId), this.pipelineAccessToken
            ));
          }
        });
      }

      await Promise.all(promises).then((data) => {
        data.forEach(row => {
          evaluateData(row.data);
        });
      });

    } catch (ex) {
      console.error(ex);
    }
    return this.builds;
  }
  public async getListOfReleases(releaseIds?: Set<string>): Promise<IReleases> {
    const builds = await this.getListOfBuilds(releaseIds);
    if (builds) {
      // tslint:disable-next-line: forin
      for (const id in builds) {
        this.releases[id] = {
          releaseName: id,
          // tslint:disable-next-line: object-literal-sort-keys
          id,
          imageVersion: "test-image",
          queueTime: builds[id].queueTime,
          status: builds[id].status,
          result: builds[id].result,
          startTime: builds[id].startTime,
          finishTime: builds[id].finishTime,
          URL: builds[id].URL,
          lastUpdateTime: builds[id].lastUpdateTime
        }
      }
    }

    return this.releases;
  }
  public async getBuildStages(build: IBuild): Promise<IPipelineStages> {
    return {};
  };
}

export default GithubActions;
