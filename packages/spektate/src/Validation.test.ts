import * as azure from "azure-storage";
import * as fs from "fs";
import { HttpHelper } from "./HttpHelper";
import { IDeployment } from "./IDeployment";
import * as Deployment from "./IDeployment";
import {
  compare,
  duration,
  endTime,
  getDeploymentsBasedOnFilters,
  getRepositoryFromURL,
  parseDeploymentsFromDB,
  status
} from "./IDeployment";
import { AzureDevOpsPipeline } from "./pipeline/AzureDevOpsPipeline";
import { IBuild } from "./pipeline/Build";
import IPipeline from "./pipeline/Pipeline";
import { IRelease } from "./pipeline/Release";
import { IAuthor } from "./repository/Author";
import { IAzureDevOpsRepo } from "./repository/IAzureDevOpsRepo";
import * as AzureDevOpsRepo from "./repository/IAzureDevOpsRepo";
import { IGitHub } from "./repository/IGitHub";
import * as GitHub from "./repository/IGitHub";
import { IPullRequest } from "./repository/IPullRequest";
import {
  createPipeline,
  IErrors,
  IValidationError,
  validateConfiguration,
  verifyManifestRepo,
  verifyPipeline,
  verifySourceRepoAccess,
  verifyStorageCredentials
} from "./Validation";
const mockDirectory = "src/mocks/";
let rawDeployments: IDeployment[];

// Declare these with a test name since response is mocked
const srcPipeline = new AzureDevOpsPipeline("test-org", "test-project");
const hldPipeline = new AzureDevOpsPipeline("test-org", "test-project");
const clusterPipeline = new AzureDevOpsPipeline("test-org", "test-project");
const dummyAuthor = {
  imageUrl: "",
  name: "",
  url: "",
  username: ""
};
const dummyPR = {
  description: "",
  id: 0,
  sourceBranch: "",
  targetBranch: "",
  title: "",
  url: ""
};

jest
  .spyOn(AzureDevOpsPipeline.prototype, "getBuildStages")
  .mockReturnValue(Promise.resolve({}));
jest
  .spyOn(AzureDevOpsPipeline.prototype, "getListOfReleases")
  .mockReturnValue(Promise.resolve({}));
jest
  .spyOn(AzureDevOpsPipeline.prototype, "getListOfBuilds")
  .mockReturnValue(Promise.resolve({}));
jest.spyOn(GitHub, "getAuthor").mockReturnValue(Promise.resolve(dummyAuthor));
jest
  .spyOn(AzureDevOpsRepo, "getAuthor")
  .mockReturnValue(Promise.resolve(dummyAuthor));
jest.spyOn(GitHub, "getPullRequest").mockReturnValue(Promise.resolve(dummyPR));
jest
  .spyOn(AzureDevOpsRepo, "getPullRequest")
  .mockReturnValue(Promise.resolve(dummyPR));

jest.spyOn(Deployment, "cleanUpDeploymentsFromDB").mockReturnValue();

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
  parseDeploymentsFromDB(
    rawDeployments,
    srcPipeline,
    hldPipeline,
    clusterPipeline,
    "account-name",
    "account-key",
    "table-name",
    value => {
      jest
        .spyOn(Deployment, "getDeployments")
        .mockReturnValue(Promise.resolve(value as IDeployment[]));
    },
    // tslint:disable-next-line: no-empty
    () => {}
  );
  updatePipelineDates();
});

describe("Deployment", () => {
  test("fetch PR", async () => {
    jest.spyOn(Deployment, "getDeployments").mockResolvedValue(rawDeployments);
    await validateConfiguration(
      "account-name",
      "account-key",
      "table-name",
      "partition-key",
      "org",
      "",
      "pipeline-token",
      "source-repo-token",
      "manifest-repo",
      "manifest-token",
      "github-org"
    ).then(async (e: IErrors) => {
      expect(e.errors).toHaveLength(3);

      await verifyManifestRepo("manifest-repo", "pat", "org", "project")
        .then(async (e1: IValidationError | undefined) => {
          expect(e1).toBeDefined();

          await verifyManifestRepo("", "pat", "org", "project").then(
            async (e2: IValidationError | undefined) => {
              expect(e2).toBeDefined();

              await verifyPipeline("", "", "").then(
                async (e3: IValidationError | undefined) => {
                  expect(e3).toBeDefined();

                  jest
                    .spyOn(Deployment, "fetchAuthor")
                    .mockReturnValueOnce(Promise.resolve(undefined));
                  await verifySourceRepoAccess(
                    "account-name",
                    "account-key",
                    "table-name",
                    "partition-key",
                    "source-repo-token",
                    srcPipeline,
                    hldPipeline,
                    clusterPipeline
                  ).then((e4: IValidationError | undefined) => {
                    expect(e4).toBeDefined();
                  });
                }
              );
            }
          );
        })
        .catch(_ => {
          expect(true).toBeFalsy();
        });
    });
  }, 30000);
});

const updateDatesOnPipeline = (oBuilds: {
  [id: string]: IBuild | IRelease;
}) => {
  for (const id in oBuilds) {
    if (id) {
      const item = oBuilds[id];
      item.finishTime = new Date(item.finishTime);
      item.startTime = new Date(item.startTime);
      item.queueTime = new Date(item.queueTime);
      if (item.lastUpdateTime) {
        item.lastUpdateTime = new Date(item.lastUpdateTime);
      }
    }
  }
};

// Since pipelines are coming from mock json, they need to be converted to date formats
const updatePipelineDates = () => {
  updateDatesOnPipeline(srcPipeline.builds);
  updateDatesOnPipeline(hldPipeline.releases);
  updateDatesOnPipeline(clusterPipeline.builds);
};
