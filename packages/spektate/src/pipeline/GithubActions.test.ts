import { AxiosResponse } from "axios";
import * as fs from "fs";
import { HttpHelper } from "../HttpHelper";
import { GithubActions } from "./GithubActions";

const mockDirectory = "src/pipeline/mocks/";

describe("Github actions pipeline", () => {
  test("gets builds and releases", async () => {
    let pipeline = new GithubActions("source-repo", "accesstoken");
    const jobsResponse: { [id: string]: any } = {
      "1115488431": JSON.parse(
        fs.readFileSync(mockDirectory + "gh-actions-1115488431.json", "utf-8")
      ),
      "1255355142": JSON.parse(
        fs.readFileSync(mockDirectory + "gh-actions-1255355142.json", "utf-8")
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

    await pipeline.getListOfBuilds(new Set(["1115488431"]));
    expect(Object.keys(pipeline.builds)).toHaveLength(1);
    expect(Object.keys(pipeline.builds).includes("1115488431"));

    await pipeline.getListOfBuilds(new Set(["1115488431", "1255355142"]));
    expect(Object.keys(pipeline.builds)).toHaveLength(2);
    expect(Object.keys(pipeline.builds).includes("1115488431"));
    expect(Object.keys(pipeline.builds).includes("1255355142"));

    pipeline = new GithubActions("source-repo", "accesstoken");

    await pipeline.getListOfReleases(new Set());
    expect(pipeline.releases).toStrictEqual({});

    await pipeline.getListOfReleases(new Set(["1115488431", "1255355142"]));
    expect(Object.keys(pipeline.releases)).toHaveLength(2);
    expect(Object.keys(pipeline.releases).includes("1115488431"));
    expect(Object.keys(pipeline.releases).includes("1255355142"));
  });
});