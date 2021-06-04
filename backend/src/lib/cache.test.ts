import { IAuthor } from "spektate/lib/repository/Author";
import * as author from "./author";
import * as pr from "./pullRequest";
import {
  fetch,
  fetchAuthor,
  purge,
  update,
  updateChangedDeployment,
  updateNewDeployment,
  updateOldDeployment,
  fetchPullRequest,
  fetchClusterSync,
} from "./cache";
import * as cache from "./cache";
import { deepClone, IDeployments, IDeploymentData } from "./common";
import * as deployments from "./deployments";
import { data as deploymentData } from "./mocks/deploymentsData";
import { data as deploymentDataExtra } from "./mocks/deploymentsDataExtra";
import * as testCommon from "./test-common";
import * as clusterSync from "./clustersync";
import { IPullRequest } from "spektate/lib/repository/IPullRequest";
import { IClusterSync } from "spektate/lib/repository/Tag";

const emptyDeployments: IDeployments = {
  deployments: [],
  clusterSync: undefined,
  fluxStatuses: undefined,
};
const mockedDeployment: IDeployments = {
  deployments: deploymentData as any,
  clusterSync: undefined,
  fluxStatuses: undefined,
};
const mockedDeploymentExtra: IDeployments = {
  deployments: deploymentDataExtra as any,
  clusterSync: undefined,
  fluxStatuses: undefined,
};
jest.spyOn(clusterSync, "get").mockResolvedValue(Promise.resolve(undefined));

describe("test update and fetch function", () => {
  it("sanity test", async () => {
    purge();
    const data = deepClone(deploymentData);
    jest.spyOn(deployments, "list").mockResolvedValueOnce(data as any);
    // 3 times because there are 3 items in deploymentData
    testCommon.mockFetchAuthor(true);
    testCommon.mockFetchAuthor();
    testCommon.mockFetchAuthor();
    testCommon.mockFetchPullRequest(true);
    testCommon.mockFetchPullRequest();
    testCommon.mockFetchPullRequest();

    await update();

    const cached = fetch();
    expect(cached.deployments.length).toBe(3);

    // fetch author works
    cached.deployments.forEach((c, idx) => {
      expect(c.srcToDockerBuild).toBeDefined();
      if (c.srcToDockerBuild) {
        if (idx === 2) {
          expect(c.author).toBeUndefined();
          expect(c.pullRequest).toBeUndefined();
        } else {
          expect(c.author).toBeDefined();
          expect(c.pullRequest).toBeDefined();
        }
      }
    });
  });
  it("negative test", async () => {
    jest
      .spyOn(deployments, "list")
      .mockRejectedValueOnce(Error("server error"));
    // when there is a server error, update function will not throw exception
    // it will try again in the next interval.
    await update();
  });
});

describe("test fetchAuthor function", () => {
  it("undefined test", async () => {
    jest.spyOn(author, "get").mockResolvedValueOnce(undefined);
    const deployment = {
      commitId: "be3c7f6",
      deploymentId: "c3e4a8937af9",
      sourceRepo:
        "https://dev.azure.com/epictest/hellobedrockprivate/_git/hello-bedrock",
      srcToDockerBuild: {
        author: undefined,
        sourceVersion: "be3c7f65b7c9eb792a7af3ff1f7d3d187cd47773",
      },
    };
    await fetchAuthor(deployment as any);
    expect(deployment.srcToDockerBuild.author).toBeUndefined();
  });
  it("exception test for author", async () => {
    jest.spyOn(author, "get").mockImplementation(
      (_: IDeploymentData): Promise<IAuthor | undefined> => {
        return new Promise((resolve, reject) => {
          reject("Author not found");
        });
      }
    );
    const deployment = {
      commitId: "be3c7f6",
      deploymentId: "c3e4a8937af9",
      sourceRepo:
        "https://dev.azure.com/epictest/hellobedrockprivate/_git/hello-bedrock",
      srcToDockerBuild: {
        author: undefined,
        sourceVersion: "be3c7f65b7c9eb792a7af3ff1f7d3d187cd47773",
      },
    };
    expect(async () => {
      await fetchAuthor(deployment as any);
      expect(deployment.srcToDockerBuild.author).toBeUndefined();
    }).not.toThrow();
  });
  it("exception test for PR", async () => {
    jest.spyOn(pr, "get").mockImplementation(
      (_: IDeploymentData): Promise<IPullRequest | undefined> => {
        return new Promise((resolve, reject) => {
          reject("PR not found");
        });
      }
    );
    const deployment = {
      commitId: "be3c7f6",
      deploymentId: "c3e4a8937af9",
      sourceRepo:
        "https://dev.azure.com/epictest/hellobedrockprivate/_git/hello-bedrock",
      srcToDockerBuild: {
        author: undefined,
        sourceVersion: "be3c7f65b7c9eb792a7af3ff1f7d3d187cd47773",
      },
      pullRequest: undefined,
    };
    expect(async () => {
      await fetchPullRequest(deployment as any);
      expect(deployment.pullRequest).toBeUndefined();
    }).not.toThrow();
  });
  it("exception test for cluster sync", async () => {
    jest.spyOn(clusterSync, "get").mockImplementation(
      (): Promise<IClusterSync | undefined> => {
        return new Promise((resolve, reject) => {
          reject("Not found");
        });
      }
    );
    expect(async () => {
      const clustersync = await fetchClusterSync();
      expect(clustersync).toBeUndefined();
    }).not.toThrow();
  });
  it("srcToDockerBuild test", async () => {
    jest.spyOn(author, "get").mockResolvedValueOnce({
      name: "test",
    } as any);
    const deployment = {
      author: undefined,
      commitId: "be3c7f6",
      deploymentId: "c3e4a8937af9",
      hldToManifestBuild: {
        sourceVersion: "be3c7f65b7c9eb792a7af3ff1f7d3d187cd47773",
      },
      sourceRepo:
        "https://dev.azure.com/epictest/hellobedrockprivate/_git/hello-bedrock",
      srcToDockerBuild: {
        sourceVersion: "be3c7f65b7c9eb792a7af3ff1f7d3d187cd47773",
      },
    };
    await fetchAuthor(deployment as any);
    expect(deployment.author).toBeDefined();

    if (deployment.author) {
      expect((deployment.author! as IAuthor).name).toBe("test");
    }
  });
  it("hldToManifestBuild test", async () => {
    jest.spyOn(author, "get").mockResolvedValueOnce({
      name: "test",
    } as any);
    const deployment = {
      author: undefined,
      commitId: "be3c7f6",
      deploymentId: "c3e4a8937af9",
      hldToManifestBuild: {
        sourceVersion: "be3c7f65b7c9eb792a7af3ff1f7d3d187cd47773",
      },
      sourceRepo:
        "https://dev.azure.com/epictest/hellobedrockprivate/_git/hello-bedrock",
    };
    await fetchAuthor(deployment as any);
    expect(deployment.author).toBeDefined();
  });
});

describe("test updateChangedDeployment function", () => {
  it("cache is empty and no data", async () => {
    const cached: IDeployments = {
      deployments: [],
      clusterSync: undefined,
      fluxStatuses: undefined,
    };
    await updateChangedDeployment(cached, deepClone(emptyDeployments));
    expect(cached.deployments).toStrictEqual([]);
  });
  it("cache is empty and new data", async () => {
    const cached: IDeployments = deepClone(emptyDeployments);
    await updateChangedDeployment(cached, mockedDeployment);
    expect(cached.deployments).toStrictEqual([]);
  });
  it("cache is not empty and latest data is the same", async () => {
    jest
      .spyOn(deployments, "list")
      .mockResolvedValueOnce(mockedDeployment as any);
    const cached: IDeployments = mockedDeployment as any;
    const originalCache = deepClone(cached);

    const fnFetchAuthor = jest.spyOn(cache, "fetchAuthor");
    fnFetchAuthor.mockReset();
    fnFetchAuthor.mockResolvedValueOnce();
    fnFetchAuthor.mockResolvedValueOnce();

    const fnFetchPullRequest = jest.spyOn(cache, "fetchPullRequest");
    fnFetchPullRequest.mockReset();
    fnFetchPullRequest.mockResolvedValueOnce();
    fnFetchPullRequest.mockResolvedValueOnce();

    await updateChangedDeployment(cached, mockedDeployment);
    expect(cached.deployments).toStrictEqual(originalCache.deployments);
  });
  it("cache is not empty and latest data is empty", async () => {
    const cached: IDeployments = mockedDeployment;
    const originalCache = deepClone(cached);
    await updateChangedDeployment(cached, deepClone(emptyDeployments));
    expect(cached.deployments).toStrictEqual(originalCache.deployments);
  });
  it("cache is not empty and latest data has new item", async () => {
    const cached: IDeployments = mockedDeployment;
    const originalCache = deepClone(cached);

    const fnFetchAuthor = jest.spyOn(cache, "fetchAuthor");
    fnFetchAuthor.mockReset();
    fnFetchAuthor.mockResolvedValueOnce();
    fnFetchAuthor.mockResolvedValueOnce();

    const fnFetchPullRequest = jest.spyOn(cache, "fetchPullRequest");
    fnFetchPullRequest.mockReset();
    fnFetchPullRequest.mockResolvedValueOnce();
    fnFetchPullRequest.mockResolvedValueOnce();

    await updateChangedDeployment(cached, originalCache);
    expect(cached.deployments).toStrictEqual(originalCache.deployments);
  });
  it("cache is not empty and latest data has changed item", async () => {
    const fnFetchAuthor = jest.spyOn(cache, "fetchAuthor");
    fnFetchAuthor.mockReset();
    fnFetchAuthor.mockResolvedValueOnce();

    const fnFetchPullRequest = jest.spyOn(cache, "fetchPullRequest");
    fnFetchPullRequest.mockReset();
    fnFetchPullRequest.mockResolvedValueOnce();

    const ts = "2021-02-26T00:03:29.451Z";
    const changed = deepClone(deploymentData);
    const oldTs = changed[0].timeStamp;
    changed[0].timeStamp = ts;

    const cacheObj: IDeployments = mockedDeployment;
    const sz = cacheObj.deployments.length;

    const changedDeps: IDeployments = {
      deployments: changed as any,
      clusterSync: undefined,
      fluxStatuses: undefined,
    };

    await updateChangedDeployment(cacheObj, changedDeps);

    // no change in size
    expect(cacheObj.deployments.length).toBe(sz);

    // changed item is replaced
    expect(cacheObj.deployments[0].timeStamp).toBe(ts);
    expect(cacheObj.deployments[0].timeStamp).not.toBe(oldTs);
    expect(fnFetchAuthor).toBeCalledTimes(2);
    expect(fnFetchPullRequest).toBeCalledTimes(2);
  });
});

describe("test updateNewDeployment function", () => {
  it("cache is empty and no data", async () => {
    await updateNewDeployment(emptyDeployments, deepClone(emptyDeployments));
  });
  it("cache is empty and new data", async () => {
    const fnFetchAuthor = jest.spyOn(cache, "fetchAuthor");
    fnFetchAuthor.mockReset();
    fnFetchAuthor.mockResolvedValueOnce();
    fnFetchAuthor.mockResolvedValueOnce();
    fnFetchAuthor.mockResolvedValueOnce();

    const fnFetchPullRequest = jest.spyOn(cache, "fetchPullRequest");
    fnFetchPullRequest.mockReset();
    fnFetchPullRequest.mockResolvedValueOnce();
    fnFetchPullRequest.mockResolvedValueOnce();
    fnFetchPullRequest.mockResolvedValueOnce();

    await updateNewDeployment(emptyDeployments, mockedDeployment);
    expect(fnFetchAuthor).toBeCalledTimes(3);
    expect(fnFetchPullRequest).toBeCalledTimes(3);
  });
  it("cache is not empty and latest data is the same", async () => {
    const fnFetchAuthor = jest.spyOn(cache, "fetchAuthor");
    fnFetchAuthor.mockReset();
    const fnFetchPullRequest = jest.spyOn(cache, "fetchPullRequest");
    fnFetchPullRequest.mockReset();

    await updateNewDeployment(mockedDeployment, mockedDeployment);
    expect(fnFetchAuthor).toBeCalledTimes(0);
    expect(fnFetchPullRequest).toBeCalledTimes(0);
  });
  it("cache is not empty and latest data is empty", async () => {
    const fnFetchAuthor = jest.spyOn(cache, "fetchAuthor");
    fnFetchAuthor.mockReset();
    const fnFetchPullRequest = jest.spyOn(cache, "fetchPullRequest");
    fnFetchPullRequest.mockReset();

    await updateNewDeployment(mockedDeployment, emptyDeployments);
    expect(fnFetchAuthor).toBeCalledTimes(0);
    expect(fnFetchPullRequest).toBeCalledTimes(0);
  });
  it("cache is not empty and latest data has new item", async () => {
    const fnFetchAuthor = jest.spyOn(cache, "fetchAuthor");
    fnFetchAuthor.mockReset();
    fnFetchAuthor.mockResolvedValueOnce();
    const fnFetchPullRequest = jest.spyOn(cache, "fetchPullRequest");
    fnFetchPullRequest.mockReset();
    fnFetchPullRequest.mockResolvedValueOnce();

    await updateNewDeployment(mockedDeployment, mockedDeploymentExtra);
    expect(fnFetchAuthor).toBeCalledTimes(1);
    expect(fnFetchPullRequest).toBeCalledTimes(1);
  });
});

describe("test updateOldDeployment function", () => {
  it("cache is empty and no data", () => {
    const res = updateOldDeployment([], []);
    expect(res).toStrictEqual([]);
  });
  it("cache is empty and new data", () => {
    const res = updateOldDeployment([], deploymentData as any);
    expect(res).toStrictEqual([]);
  });
  it("cache is not empty and latest data is the same", () => {
    const originalCache = deepClone(mockedDeployment);
    const res = updateOldDeployment(
      deploymentData as any,
      deploymentData as any
    );
    expect(res).toStrictEqual(originalCache.deployments);
  });
  it("cache is not empty and latest data is empty", () => {
    const res = updateOldDeployment(deploymentData as any, []);
    expect(res).toStrictEqual([]);
  });
  it("cache is not empty and latest data has new item", () => {
    const originalCache = deepClone(mockedDeployment);
    const res = updateOldDeployment(
      deploymentData as any,
      deploymentDataExtra as any
    );
    expect(res).toStrictEqual(originalCache.deployments);
  });
  it("cache is not empty and latest data has one less item", () => {
    const res = updateOldDeployment(
      deploymentDataExtra as any,
      deploymentData as any
    );
    expect(res.length).toBe(deploymentData.length);
  });
});
