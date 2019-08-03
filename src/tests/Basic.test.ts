
import { expect } from 'chai';
import 'mocha';
import { AccessHelper } from '../cli/AccessHelper';
import { config } from '../config';
import Deployment from '../models/Deployment';
import AzureDevOpsPipeline from '../models/pipeline/AzureDevOpsPipeline';

describe('config validation', () => {
    it('should be configured', () => {
        AccessHelper.verifyAppConfiguration(() => {
            expect(config.SRC_PIPELINE_ID).to.not.equal(0);
            expect(config.HLD_PIPELINE_ID).to.not.equal(0);
            expect(config.DOCKER_PIPELINE_ID).to.not.equal(0);
            expect(config.AZURE_ORG.length).to.not.equal(0);
            expect(config.AZURE_PROJECT.length).to.not.equal(0);
            expect(config.GITHUB_MANIFEST.length).to.not.equal(0);
            expect(config.GITHUB_MANIFEST_USERNAME.length).to.not.equal(0);
            expect(config.STORAGE_ACCOUNT_KEY.length).to.not.equal(0);
            expect(config.STORAGE_ACCOUNT_NAME.length).to.not.equal(0);
            expect(config.STORAGE_PARTITION_KEY.length).to.not.equal(0);
            expect(config.STORAGE_TABLE_NAME.length).to.not.equal(0);
        });
    });
});

describe('cluster-sync', () => {
    it('should return the most recent sync tag', () => {
        AccessHelper.getClusterSync((syncCommit) => {
            expect(syncCommit.length).to.equal(7);
        });
    });
});

describe('deployments', () => {
    it('should return some deployments', () => {
        const srcPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.SRC_PIPELINE_ID);
        const hldPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.DOCKER_PIPELINE_ID, true);
        const clusterPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.HLD_PIPELINE_ID);

        Deployment.getDeployments(config.STORAGE_PARTITION_KEY, srcPipeline, hldPipeline, clusterPipeline, (deployments: Deployment[]) => {
            expect(deployments.length).to.greaterThan(0);
        });
    });
});