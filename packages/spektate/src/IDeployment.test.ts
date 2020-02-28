import * as azure from "azure-storage";
import * as fs from "fs";
import { IDeployment } from "./IDeployment";
import * as Deployment from "./IDeployment";
import {
  compare,
  duration,
  endTime,
  getDeploymentsBasedOnFilters,
  parseDeploymentsFromDB,
  status
} from "./IDeployment";
import { AzureDevOpsPipeline } from "./pipeline/AzureDevOpsPipeline";
import IPipeline, { IBuilds, IReleases } from "./pipeline/Pipeline";
import { IAuthor } from "./repository/Author";

const mockDirectory = "src/mocks/";
let rawDeployments: IDeployment[];
let query: azure.TableQuery | undefined;

// Declare these with a test name since response is mocked
const srcPipeline = new AzureDevOpsPipeline("test-org", "test-project", false);
const hldPipeline = new AzureDevOpsPipeline("test-org", "test-project", true);
const clusterPipeline = new AzureDevOpsPipeline(
  "test-org",
  "test-project",
  false
);

jest.spyOn(AzureDevOpsPipeline.prototype, "getListOfBuilds").mockImplementation(
  (buildIds?: Set<string>): Promise<IBuilds> => {
    return new Promise<IBuilds>(resolve => {
      resolve({});
    });
  }
);

jest
  .spyOn(AzureDevOpsPipeline.prototype, "getListOfReleases")
  .mockImplementation(
    (releaseIds?: Set<string>): Promise<IReleases> => {
      return new Promise<IReleases>(resolve => {
        resolve({});
      });
    }
  );

jest.spyOn(Deployment, "getDeployments").mockImplementation(
  (
    storageAccount: string,
    storageAccountKey: string,
    storageTableName: string,
    partitionKey: string,
    srcPipeline1: IPipeline,
    hldPipeline1: IPipeline,
    manifestPipeline: IPipeline,
    query1?: azure.TableQuery
  ): Promise<IDeployment[]> => {
    query = query1;
    return new Promise(resolve => {
      resolve(rawDeployments);
    });
  }
);

jest
  .spyOn(Deployment, "cleanUpDeploymentsFromDB")
  .mockImplementation(
    (
      batch: azure.TableBatch,
      storageAccount: string,
      storageAccountKey: string,
      storageAccountTable: string
    ) => {
      console.log("Mocking out db cleanup");
    }
  );

beforeAll(() => {
  rawDeployments = JSON.parse(
    fs.readFileSync(mockDirectory + "deployments.json", "utf-8")
  );
  srcPipeline.builds = JSON.parse(
    fs.readFileSync(mockDirectory + "ci-builds.json", "utf-8")
  );
  hldPipeline.releases = JSON.parse(
    fs.readFileSync(mockDirectory + "cd-releases.json", "utf-8")
  );
  clusterPipeline.builds = JSON.parse(
    fs.readFileSync(mockDirectory + "hld-builds.json", "utf-8")
  );
  updatePipelineDates();
});

describe("Deployment", () => {
  test("Deployments parsing is working as expected", () => {
    new Promise(resolve => {
      parseDeploymentsFromDB(
        rawDeployments,
        srcPipeline,
        hldPipeline,
        clusterPipeline,
        "",
        "",
        "",
        resolve
      );
    }).then(value => {
      expect(value).toHaveLength(62);
      const deps = value as IDeployment[];
      let verified = false;
      deps.forEach(dep => {
        if (dep.deploymentId === "179c843496bd") {
          expect(status(dep)).toBe("Complete");
          expect(endTime(dep).getTime()).toBe(
            new Date("2019-10-31T18:15:53.767Z").getTime()
          );
          expect(duration(dep)).toBe("9.24");
          verified = true;
        }
      });
      expect(verified).toBe(true);

      deps.sort(compare);
      expect(deps).toHaveLength(62);
      expect(endTime(deps[61]).getTime() < endTime(deps[0]).getTime()).toBe(
        true
      );
      expect(endTime(deps[1]).getTime() < endTime(deps[0]).getTime());
    });
  });
});

describe("Deployment", () => {
  test("Query string is built correctly to pull from storage", () => {
    getDeploymentsBasedOnFilters(
      "",
      "",
      "",
      "",
      srcPipeline,
      hldPipeline,
      clusterPipeline,
      "Dev",
      ""
    );
    let queryString = JSON.stringify(query);
    expect(queryString.includes("env eq 'dev'")).toBe(true);
    getDeploymentsBasedOnFilters(
      "",
      "",
      "",
      "",
      srcPipeline,
      hldPipeline,
      clusterPipeline,
      "",
      "tag",
      "211",
      "abcdefg",
      "service",
      "depId"
    );
    queryString = JSON.stringify(query);
    expect(queryString.includes("imageTag eq 'tag'")).toBe(true);
    expect(queryString.includes("p1 eq '211'")).toBe(true);
    expect(queryString.includes("commitId eq 'abcdefg'")).toBe(true);
    expect(queryString.includes("service eq 'service'")).toBe(true);
    expect(queryString.includes("RowKey eq 'depid'")).toBe(true);
  });
});

// Since pipelines are coming from mock json, they need to be converted to date formats
const updatePipelineDates = () => {
  for (const build in srcPipeline.builds) {
    if (build) {
      srcPipeline.builds[build].finishTime = new Date(
        srcPipeline.builds[build].finishTime
      );
      srcPipeline.builds[build].startTime = new Date(
        srcPipeline.builds[build].startTime
      );
      srcPipeline.builds[build].queueTime = new Date(
        srcPipeline.builds[build].queueTime
      );
      if (srcPipeline.builds[build].lastUpdateTime) {
        srcPipeline.builds[build].lastUpdateTime = new Date(
          srcPipeline.builds[build].lastUpdateTime!
        );
      }
    }
  }
  for (const build in hldPipeline.releases) {
    if (build) {
      hldPipeline.releases[build].finishTime = new Date(
        hldPipeline.releases[build].finishTime
      );
      hldPipeline.releases[build].startTime = new Date(
        hldPipeline.releases[build].startTime
      );
      hldPipeline.releases[build].queueTime = new Date(
        hldPipeline.releases[build].queueTime
      );
      if (hldPipeline.releases[build].lastUpdateTime) {
        hldPipeline.releases[build].lastUpdateTime = new Date(
          hldPipeline.releases[build].lastUpdateTime!
        );
      }
    }
  }
  for (const build in clusterPipeline.builds) {
    if (build) {
      clusterPipeline.builds[build].finishTime = new Date(
        clusterPipeline.builds[build].finishTime
      );
      clusterPipeline.builds[build].startTime = new Date(
        clusterPipeline.builds[build].startTime
      );
      clusterPipeline.builds[build].queueTime = new Date(
        clusterPipeline.builds[build].queueTime
      );
      if (clusterPipeline.builds[build].lastUpdateTime) {
        clusterPipeline.builds[build].lastUpdateTime = new Date(
          clusterPipeline.builds[build].lastUpdateTime!
        );
      }
    }
  }
};
