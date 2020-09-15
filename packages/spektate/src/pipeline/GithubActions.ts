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
      console.log(JSON.stringify(data));
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
      console.log(`Adding ${JSON.stringify(this.builds[data.run_id])} for ${data.run_id}`);
    }
    try {
      if (buildIds) {
        buildIds.forEach((buildId: string) => {
          promises.push(HttpHelper.httpGet(
            jobsUrl.replace("{repository}", this.sourceRepo).replace("{jobId}", buildId), this.pipelineAccessToken
          ));
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
    console.log(`Returning ${JSON.stringify(this.builds)}`);
    return this.builds;
  }
  public async getListOfReleases(releaseIds?: Set<string>): Promise<IReleases> {
    return {};
  }
  public async getBuildStages(build: IBuild): Promise<IPipelineStages> {
    return {};
  };
}

export default GithubActions;
