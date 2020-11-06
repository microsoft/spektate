import { get } from "./clustersync";
import * as AzureDevOpsRepo from "spektate/lib/repository/IAzureDevOpsRepo";
import * as GitHub from "spektate/lib/repository/IGitHub";
import { ITag } from "spektate/lib/repository/Tag";
import { getMockedConfig } from "./test-common";
import * as config from "../config";
import { RepositoryType, PipelineType } from "../config";

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
          dockerVersion: "mockedVersion",
          pipelineConfig: {
            accessToken: "test",
          },
          repoConfig: {
            manifestRepo: "https://github.com/test/manifest",
            sourceRepo: "https://github.com/samiya/test-src",
            hldRepo: "https://github.com/samiya/test-hld",
            accessToken: "cf8a78a2abcdsomekey65b0cb9bd8dsomekeyfsomekey",
          },
          storageAccessKey: "access-key-seeeeeecret",
          storageAccountName: "storageaccount",
          storagePartitionKey: "partition-key",
          storageTableName: "table-name",
          repoType: RepositoryType.GITHUB,
          pipelineType: PipelineType.GITHUB_ACTIONS,
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
          dockerVersion: "",
          pipelineConfig: {
            org: "",
            project: "",
          },
          repoConfig: {
            manifestRepo: "",
            accessToken: "",
          },
          storageAccessKey: "",
          storageAccountName: "",
          storagePartitionKey: "",
          storageTableName: "",
          repoType: RepositoryType.AZDO,
          pipelineType: PipelineType.AZDO,
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
