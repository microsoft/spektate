import { AxiosResponse } from "axios";
import * as fs from "fs";
import { HttpHelper } from "../HttpHelper";
import { AzureDevOpsPipeline } from "./AzureDevOpsPipeline";
import { IBuilds } from "./Pipeline";

const mockDirectory = "src/pipeline/mocks/";

// Declare these with a test name since response is mocked
const buildPipeline = new AzureDevOpsPipeline(
  "test-org",
  "test-project",
  false
);
let currentRawResponse = {};
const releasePipeline = new AzureDevOpsPipeline(
  "test-org",
  "test-project",
  true
);

jest.spyOn(HttpHelper, "httpGet").mockImplementation(
  <T>(theUrl: string, accessToken?: string): Promise<AxiosResponse<T>> => {
    return new Promise(resolve => {
      const response: AxiosResponse<any> = {
        config: {},
        data: currentRawResponse,
        headers: "",
        status: 200,
        statusText: ""
      };
      resolve(response);
    });
  }
);

describe("Pipeline", () => {
  test("Gets builds, releases and stages correctly", async () => {
    currentRawResponse = {
      value: JSON.parse(
        fs.readFileSync(mockDirectory + "raw-builds.json", "utf-8")
      )
    };

    // empty set
    const result = await buildPipeline.getListOfBuilds(new Set());
    expect(result).toStrictEqual({});

    await buildPipeline.getListOfBuilds(new Set(["7271", "7176"]));
    expect(Object.keys(buildPipeline.builds)).toHaveLength(2);

    await buildPipeline.getListOfBuilds();
    expect(Object.keys(buildPipeline.builds)).toHaveLength(2);

    currentRawResponse = JSON.parse(
      fs.readFileSync(mockDirectory + "raw-build-stages.json", "utf-8")
    );

    await buildPipeline.getBuildStages(buildPipeline.builds["7271"]);
    expect(buildPipeline.builds["7271"].stages).toBeDefined();
  });
});

describe("Pipeline", () => {
  test("Gets releases correctly", async () => {
    currentRawResponse = {
      value: JSON.parse(
        fs.readFileSync(mockDirectory + "raw-releases.json", "utf-8")
      )
    };
    const result = await releasePipeline.getListOfReleases(new Set());
    expect(result).toStrictEqual({});

    await releasePipeline.getListOfReleases(
      new Set(["261", "262", "263", "264"])
    );
    expect(Object.keys(releasePipeline.releases)).toHaveLength(4);

    await releasePipeline.getListOfReleases();
    expect(Object.keys(releasePipeline.releases)).toHaveLength(4);
  });
});
