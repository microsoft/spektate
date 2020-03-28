import { get } from "./author";
import * as common from "./test-common";

describe("test get function", () => {
  it("negative test", async () => {
    common.mockFetchAuthor();
    const author = await get({} as any);
    expect(author).toBeUndefined();
  });
  it("with srcToDockerBuild", async () => {
    common.mockFetchAuthor();
    const author = await get({
      commitId: "be3c7f6",
      deploymentId: "c3e4a8937af9",
      srcToDockerBuild: {
        repository: {
          reponame: "hello-service-hooks",
          username: "johndoe"
        },
        sourceVersion: "be3c7f65b7c9eb792a7af3ff1f7d3d187cd47773"
      }
    } as any);
    expect(author).toBeDefined();
    if (author) {
      expect(author.url).toBe("hello-service-hooks\tjohndoe");
    }
  });
  it("with sourceRepo", async () => {
    common.mockFetchAuthor();
    const author = await get({
      commitId: "be3c7f6",
      deploymentId: "c3e4a8937af9",
      sourceRepo:
        "https://dev.azure.com/epictest/hellobedrockprivate/_git/hello-bedrock",
      srcToDockerBuild: {
        sourceVersion: "be3c7f65b7c9eb792a7af3ff1f7d3d187cd47773"
      }
    } as any);
    expect(author).toBeDefined();
    if (author) {
      expect(author.url).toBe("epictest\thellobedrockprivate\thello-bedrock");
    }
  });
  it("with hldToManifestBuild", async () => {
    common.mockFetchAuthor();
    const author = await get({
      commitId: "be3c7f6",
      deploymentId: "c3e4a8937af9",
      hldToManifestBuild: {
        repository: {
          reponame: "hello-service-hooks-hld",
          username: "johndoe"
        },
        sourceVersion: "e25a60a027a0a689a6afb68a1433772f7ee73e45"
      }
    } as any);
    expect(author).toBeDefined();
    if (author) {
      expect(author.url).toBe("hello-service-hooks-hld\tjohndoe");
    }
  });
  it("with hldRepo", async () => {
    common.mockFetchAuthor();
    const author = await get({
      commitId: "be3c7f6",
      deploymentId: "c3e4a8937af9",
      hldRepo:
        "https://dev.azure.com/epictest/hellobedrockprivate/_git/hello-bedrock",
      hldToManifestBuild: {
        sourceVersion: "e25a60a027a0a689a6afb68a1433772f7ee73e45"
      }
    } as any);
    expect(author).toBeDefined();
    if (author) {
      expect(author.url).toBe("epictest\thellobedrockprivate\thello-bedrock");
    }
  });
});
