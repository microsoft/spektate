import {
  cacheRefreshInterval,
  isConfigValid,
  RepositoryType,
  PipelineType,
} from "./config";
import * as config from "./config";

describe("test cacheRefreshInterval function", () => {
  it("sanity test: default value", () => {
    process.env.REACT_APP_CACHE_REFRESH_INTERVAL_IN_SEC = "";
    expect(cacheRefreshInterval()).toBe(30000);
  });
  it("sanity test: set 50 seconds", () => {
    process.env.REACT_APP_CACHE_REFRESH_INTERVAL_IN_SEC = "50";
    expect(cacheRefreshInterval()).toBe(50000);
  });
  it("negative test", () => {
    process.env.REACT_APP_CACHE_REFRESH_INTERVAL_IN_SEC = ")*";
    expect(cacheRefreshInterval()).toBe(30000);
  });
});

describe("test isConfigValid function", () => {
  // postiive tests are already covered by other functions
  it("negative test", () => {
    jest.spyOn(config, "getConfig").mockImplementationOnce(
      (): config.IConfig => {
        return {
          dockerVersion: "mockedVersion",
          pipelineConfig: {
            org: "",
            project: "",
          },
          repoConfig: {
            manifestRepo: "",
            accessToken: "cf8a78a2abcdsomekey65b0cb9bd8dsomekeyfsomekey",
          },
          storageAccessKey: "access-key-seeeeeecret",
          storageAccountName: "storageaccount",
          storagePartitionKey: "partition-key",
          storageTableName: "",
          repoType: RepositoryType.AZDO,
          pipelineType: PipelineType.AZDO,
        };
      }
    );
    expect(isConfigValid()).toBe(false);
  });
});
