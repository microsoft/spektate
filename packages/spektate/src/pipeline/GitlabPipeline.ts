import { HttpHelper } from "../HttpHelper";
import { IBuild } from "./Build";
import { IBuilds, IPipeline, IReleases } from "./Pipeline";
import { IPipelineStage, IPipelineStages } from "./PipelineStage";

const pipelinesApi = "https://gitlab.com/api/v4/projects/{projectId}/pipelines/{pipelineId}";

export class GitlabPipeline implements IPipeline {
  public builds: IBuilds = {};
  public releases: IReleases = {};
  public repoProjectId: string = "";
  public pipelineAccessToken?: string;

  constructor(repoProjectId: string, accessToken?: string) {
    this.repoProjectId = repoProjectId;
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
      const sourceVersionUrl = data.web_url ? data.web_url.replace("pipelines", "commit").replace(data.web_url.split("/").pop(), "") + data.sha : "";
      const newBuild: IBuild = {
        URL: data.web_url,
        author: "Unavailable",
        buildNumber: data.id,
        finishTime: new Date(data.finished_at),
        id: data.id,
        lastUpdateTime: new Date(data.updated_at),
        queueTime: new Date(data.started_at),
        result: data.status,
        sourceBranch: data.ref,
        sourceVersion: data.sha,
        sourceVersionURL: sourceVersionUrl,
        startTime: new Date(data.started_at),
        status: data.status,
        timelineURL: data.web_url,
        // tslint:disable-next-line: object-literal-sort-keys
        repository: {
          projectId: this.repoProjectId
        }
      };
      this.builds[data.id] = newBuild;
    }
    try {
      if (buildIds) {
        buildIds.forEach((buildId: string) => {
          if (buildId && buildId.trim() !== "") {
            promises.push(HttpHelper.httpGet(
              pipelinesApi.replace("{projectId}", this.repoProjectId).replace("{pipelineId}", buildId), this.pipelineAccessToken
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

export default GitlabPipeline;
