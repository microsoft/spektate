import { expect } from "chai";
import "mocha";
import { AccessHelper } from "../cli/AccessHelper";
import { config } from "../config";
import Deployment from "../models/Deployment";
import AzureDevOpsPipeline from "../models/pipeline/AzureDevOpsPipeline";

describe("config validation", () => {
  it("should be configured", () => {
    AccessHelper.verifyAppConfiguration(() => {
      expect(config.AZURE_ORG.length).to.not.equal(0);
      expect(config.AZURE_PROJECT.length).to.not.equal(0);
      expect(config.MANIFEST.length).to.not.equal(0);
      expect(config.GITHUB_MANIFEST_USERNAME.length).to.not.equal(0);
      expect(config.STORAGE_ACCOUNT_KEY.length).to.not.equal(0);
      expect(config.STORAGE_ACCOUNT_NAME.length).to.not.equal(0);
      expect(config.STORAGE_PARTITION_KEY.length).to.not.equal(0);
      expect(config.STORAGE_TABLE_NAME.length).to.not.equal(0);
    });
  });
});

describe("cluster-sync", () => {
  it("should return the most recent sync tag", () => {
    AccessHelper.verifyAppConfiguration(() => {
      AccessHelper.getClusterSync(syncTag => {
        expect(syncTag.commit.length).to.equal(7);
      });
    });
  });
});

describe("deployment", () => {
  it("should return a correct deployment on filter", () => {
    AccessHelper.verifyAppConfiguration(() => {
      const srcPipeline = new AzureDevOpsPipeline(
        config.AZURE_ORG,
        config.AZURE_PROJECT,
        false,
        config.AZURE_PIPELINE_ACCESS_TOKEN
      );
      const hldPipeline = new AzureDevOpsPipeline(
        config.AZURE_ORG,
        config.AZURE_PROJECT,
        true,
        config.AZURE_PIPELINE_ACCESS_TOKEN
      );
      const clusterPipeline = new AzureDevOpsPipeline(
        config.AZURE_ORG,
        config.AZURE_PROJECT,
        false,
        config.AZURE_PIPELINE_ACCESS_TOKEN
      );

      Deployment.getDeploymentsBasedOnFilters(
        config.STORAGE_PARTITION_KEY,
        srcPipeline,
        hldPipeline,
        clusterPipeline,
        "Dev",
        undefined,
        undefined,
        undefined,
        (deployments: Deployment[]) => {
          expect(deployments.length).greaterThan(0);
        }
      );
    });
  });
});
