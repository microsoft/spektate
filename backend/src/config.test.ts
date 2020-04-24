import { cacheRefreshInterval, isConfigValid } from "./config";
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
          org: "",
          project: "",
          manifestAccessToken: "",
          pipelineAccessToken: "",
          sourceRepoAccessToken: "",
          storageAccessKey: "",
          storagePartitionKey: "",
          storageAccountName: "",
          storageTableName: "",
          githubManifestUsername: "",
          manifestRepoName: "",
          dockerVersion: ""
        }
      }
    );
    expect(isConfigValid()).toBe(false);
  });
  it("negative test with response object", () => {
    const send = jest.fn();
    const status = (code: number) => {
      expect(code).toBe(500);
      return {
        send,
      };
    };

    isConfigValid({
      status,
    } as any);
  });
});
