import { HttpHelper } from "../HttpHelper";
import { IBuild } from "./Build";
import { IBuilds, IPipeline, IReleases } from "./Pipeline";
import { IPipelineStage, IPipelineStages } from "./PipelineStage";

const jobsUrl = "https://api.github.com/repos/{repository}/actions/runs/{runNumber}/jobs";
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
      if (data.total_count > 0) {
        const newBuild = {
          URL: data.jobs[0].html_url,
          author: "Unavailable",
          buildNumber: data.jobs[0].run_id,
          finishTime: new Date(data.jobs[0].completed_at),
          id: data.jobs[0].id,
          lastUpdateTime: new Date(data.jobs[0].started_at),
          queueTime: new Date(data.jobs[0].started_at),
          result: data.jobs[0].conclusion,
          sourceBranch: "sourceBranch",
          sourceVersion: data.jobs[0].head_sha,
          sourceVersionURL: shaUrl.replace("{repository}", this.sourceRepo).replace("{commitId}", data.jobs[0].head_sha),
          startTime: new Date(data.jobs[0].started_at),
          status: data.jobs[0].status,
          timelineURL: data.jobs[0].html_url
        };
        this.builds[data.jobs[0].run_id] = newBuild;
        console.log(`Adding ${JSON.stringify(this.builds[data.jobs[0].run_id])} for ${data.jobs[0].run_id}`);
      }
    }
    try {
      if (buildIds) {
        buildIds.forEach((buildId: string) => {
          promises.push(HttpHelper.httpGet(
            jobsUrl.replace("{repository}", this.sourceRepo).replace("{runNumber}", buildId), this.pipelineAccessToken
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
