import { AxiosResponse } from "axios";
import * as fs from "fs";
import { HttpHelper } from "../HttpHelper";
import { GitlabPipeline } from "./GitlabPipeline";

const mockDirectory = "src/pipeline/mocks/";

describe("Gitlab pipeline", () => {
  test("gets builds and releases", async () => {
    let pipeline = new GitlabPipeline("4738978697");
    const jobsResponse: { [id: string]: any } = {
      "208859532": JSON.parse(
        fs.readFileSync(mockDirectory + "gitlab-pipeline-1.json", "utf-8")
      ),
      "208955061": JSON.parse(
        fs.readFileSync(mockDirectory + "gitlab-pipeline-2.json", "utf-8")
      ),
    };

    jest.spyOn(HttpHelper, "httpGet").mockImplementation(
      <T>(theUrl: string, accessToken?: string): Promise<AxiosResponse<T>> => {
        const jobNumber = theUrl.split("/").slice(-1)[0];
        if (jobNumber in jobsResponse) {
          return new Promise(resolve => {
            const response: AxiosResponse<any> = {
              config: {},
              data: jobsResponse[jobNumber],
              headers: "",
              status: 200,
              statusText: ""
            };
            resolve(response);
          });
        }

        throw Error(`Job id ${jobNumber} not found`);
      }
    );

    const builds = await pipeline.getListOfBuilds(new Set());
    expect(builds).toStrictEqual({});

    await pipeline.getListOfBuilds(new Set(["208859532"]));
    expect(Object.keys(pipeline.builds)).toHaveLength(1);
    expect(Object.keys(pipeline.builds).includes("208859532"));

    await pipeline.getListOfBuilds(new Set(["208859532", "208955061"]));
    expect(Object.keys(pipeline.builds)).toHaveLength(2);
    expect(Object.keys(pipeline.builds).includes("208859532"));
    expect(Object.keys(pipeline.builds).includes("208955061"));

    pipeline = new GitlabPipeline("4738978697");

    await pipeline.getListOfReleases(new Set());
    expect(pipeline.releases).toStrictEqual({});

    await pipeline.getListOfReleases(new Set(["208859532", "208955061"]));
    expect(Object.keys(pipeline.releases)).toHaveLength(2);
    expect(Object.keys(pipeline.releases).includes("208859532"));
    expect(Object.keys(pipeline.releases).includes("208955061"));
  });
});