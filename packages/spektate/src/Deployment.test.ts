import * as azure from "azure-storage";
import * as fs from "fs";
import { Deployment } from "./Deployment";
import { AzureDevOpsPipeline } from "./pipeline/AzureDevOpsPipeline";
import IPipeline, { IBuilds, IReleases } from "./pipeline/Pipeline";
import { IAuthor } from "./repository/Author";

const mockDirectory = "src/mocks/";
let deployments: Deployment[];
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

jest
  .spyOn(Deployment, "compare")
  .mockImplementation((a: Deployment, b: Deployment): 1 | -1 => {
    return 1;
  });

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
  ): Promise<Deployment[]> => {
    query = query1;
    return new Promise(resolve => {
      resolve(deployments);
    });
  }
);

beforeAll(() => {
  deployments = JSON.parse(
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
});

describe("Deployment", () => {
  test("Deployments parsing is working as expected", () => {
    new Promise(resolve => {
      Deployment.parseDeploymentsFromDB(
        deployments,
        srcPipeline,
        hldPipeline,
        clusterPipeline,
        resolve
      );
    }).then(value => {
      expect(value).toHaveLength(62);
      const deps = value as Deployment[];
      let verified = false;
      deps.forEach(dep => {
        if (dep.deploymentId === "179c843496bd") {
          expect(dep.status()).toBe("Complete");
          expect(dep.endTime()).toBe("2019-10-31T18:15:53.767Z");
          expect(dep.duration()).toBeDefined();
          verified = true;
        }
      });
      expect(verified).toBeTruthy();
    });
  });
});

describe("Deployment", () => {
  test("Query string is built correctly to pull from storage", () => {
    Deployment.getDeploymentsBasedOnFilters(
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
    expect(queryString.includes("env eq 'dev'")).toBeTruthy();
    Deployment.getDeploymentsBasedOnFilters(
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
    expect(queryString.includes("imageTag eq 'tag'")).toBeTruthy();
    expect(queryString.includes("p1 eq '211'")).toBeTruthy();
    expect(queryString.includes("commitId eq 'abcdefg'")).toBeTruthy();
    expect(queryString.includes("service eq 'service'")).toBeTruthy();
    expect(queryString.includes("RowKey eq 'depid'")).toBeTruthy();
  });
});
