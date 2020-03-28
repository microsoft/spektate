import { get } from "./pullRequest";
import * as common from "./test-common";

describe("test get function", () => {
  it("without hldRepo", async () => {
    const pr = await get({} as any);
    expect(pr).toBeUndefined();
  });
  it("with hldRepo without prId", async () => {
    common.mockFetchPullRequest();
    const pr = await get({
      hldRepo:
        "https://dev.azure.com/epictest/hellobedrockprivate/_git/hello-bedrock"
    } as any);
    expect(pr).toBeUndefined();
  });
  it("with hldRepo and prId", async () => {
    common.mockFetchPullRequest();
    const pr = await get({
      hldRepo:
        "https://dev.azure.com/epictest/hellobedrockprivate/_git/hello-bedrock",
      pr: 100
    } as any);
    expect(pr).toBeDefined();
    expect(pr?.title).toBe("oh-pr-oh-pr-for-epictest");
  });
  it("with git hub hldRepo and prId", async () => {
    common.mockFetchPullRequest();
    const pr = await get({
      hldRepo: "https://github.com/johndoe/spartan-app",
      pr: 100
    } as any);
    expect(pr).toBeDefined();
    expect(pr?.title).toBe("oh-pr-oh-pr-for-spartan-app");
  });
});
