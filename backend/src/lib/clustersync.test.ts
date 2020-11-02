import { get } from "./clustersync";
import * as AzureDevOpsRepo from "spektate/lib/repository/IAzureDevOpsRepo";
import * as GitHub from "spektate/lib/repository/IGitHub";
import { ITag } from "spektate/lib/repository/Tag";
import { getMockedConfig } from "./test-common";
import * as config from "../config";

const mockedTag: ITag = {
  name: "tag",
  commit: "aaaaaa",
  date: new Date(),
};

jest.spyOn(AzureDevOpsRepo, "getManifestSyncState").mockResolvedValue(
  new Promise((resolve) => {
    resolve([mockedTag]);
  })
);
jest.spyOn(GitHub, "getManifestSyncState").mockResolvedValue(
  new Promise((resolve) => {
    resolve([mockedTag]);
  })
);

describe("test get function", () => {
  it("cluster sync github", async () => {
    jest.spyOn(config, "getConfig").mockImplementation(
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
          githubManifestUsername: "test",
          manifestRepoName: "manifest",
          dockerVersion: "",
          sourceRepo: "",
          hldRepo: "",
          sourceRepoProjectId: "",
          hldRepoProjectId: "",
          manifestProjectId: "",
        };
      }
    );
    const tags = await get();
    expect(tags?.releasesURL).toBe("https://github.com/test/manifest/releases");
    expect(tags?.tags).toHaveLength(1);
    expect(tags?.tags![0]).toStrictEqual(mockedTag);
  });
  it("cluster sync azdo", async () => {
    jest.spyOn(config, "getConfig").mockImplementation(
      (): config.IConfig => {
        return getMockedConfig();
      }
    );
    const tags = await get();
    expect(tags?.releasesURL).toBe(
      "https://dev.azure.com/epicorg/hellobedrock/_git/hello-manifests/tags"
    );
    expect(tags?.tags).toHaveLength(1);
    expect(tags?.tags![0]).toStrictEqual(mockedTag);
  });
  it("cluster sync negative test", async () => {
    jest.spyOn(config, "getConfig").mockImplementation(
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
          dockerVersion: "",
          sourceRepo: "",
          hldRepo: "",
          sourceRepoProjectId: "",
          hldRepoProjectId: "",
          manifestProjectId: "",
        };
      }
    );
    let flag = false;
    try {
      await get();
    } catch (e) {
      flag = true;
    }
    expect(flag).toBe(true);
  });
});
