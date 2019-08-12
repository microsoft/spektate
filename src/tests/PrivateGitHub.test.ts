
import { expect } from 'chai';
import 'mocha';
import { AccessHelper } from '../cli/AccessHelper';
import { config } from '../config';
import Deployment from '../models/Deployment';
import AzureDevOpsPipeline from '../models/pipeline/AzureDevOpsPipeline';
import { Author } from '../models/repository/Author';

describe('config validation', () => {
    it('should be configured', () => {
        AccessHelper.verifyAppConfiguration(() => {
            expect(config.SRC_PIPELINE_ID).to.not.equal(0);
            expect(config.HLD_PIPELINE_ID).to.not.equal(0);
            expect(config.DOCKER_PIPELINE_ID).to.not.equal(0);
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

describe('cluster-sync', () => {
    it('should return the most recent sync tag', () => {
        AccessHelper.verifyAppConfiguration(() => {
            AccessHelper.getClusterSync((syncCommit) => {
                expect(syncCommit.length).to.equal(7);
            });
        });
    });
});

describe('author', () => {
    it('should return the right author', () => {
        AccessHelper.verifyAppConfiguration(() => {
            AccessHelper.getAuthorForCommitOrBuild('2e0f79b', undefined, (author: Author) => {
                expect(author.username).equal("samiyaakhtar");
            });
        });
    });
});

describe('deployment', () => {
    it('should return a correct deployment on filter', () => {
        AccessHelper.verifyAppConfiguration(() => {
            const srcPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.SRC_PIPELINE_ID, false, config.AZURE_PIPELINE_ACCESS_TOKEN);
            const hldPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.DOCKER_PIPELINE_ID, true, config.AZURE_PIPELINE_ACCESS_TOKEN);
            const clusterPipeline = new AzureDevOpsPipeline(config.AZURE_ORG, config.AZURE_PROJECT, config.HLD_PIPELINE_ID, false, config.AZURE_PIPELINE_ACCESS_TOKEN);

            Deployment.getDeploymentsBasedOnFilters(config.STORAGE_PARTITION_KEY, srcPipeline, hldPipeline, clusterPipeline, "Dev", undefined, undefined, undefined, (deployments: Deployment[]) => {
                let found5644 = false;
                deployments.forEach((deployment) => {
                    if (deployment.srcToDockerBuild && deployment.srcToDockerBuild.id.toString() === "5644") {
                        found5644 = true;
                        expect(deployment.srcToDockerBuild.sourceVersion.substring(0,7)).to.equal("2e0f79b");
                        expect(deployment.srcToDockerBuild.result).to.equal("succeeded");

                        if (deployment.dockerToHldRelease && deployment.dockerToHldRelease.id.toString() === "5") {
                            expect(deployment.dockerToHldRelease.imageVersion).to.equal("hello-bedrock-private-master-5644");
                            expect(deployment.dockerToHldRelease.id.toString()).to.equal("5");
                            expect(deployment.dockerToHldRelease.status).to.equal("succeeded");
                        }

                        if (deployment.hldToManifestBuild && deployment.hldToManifestBuild.id.toString() === "5645") {
                            expect(deployment.manifestCommitId).to.equal("de1965d");
                            expect(deployment.hldToManifestBuild.id.toString()).to.equal("5645");
                            expect(deployment.hldToManifestBuild.result).to.equal("succeeded");
                        }
                        if (deployment.srcToDockerBuild.repository) {
                            deployment.srcToDockerBuild.repository.getAuthor(deployment.srcToDockerBuild.sourceVersion, (author: Author) => {
                                expect(author.username).to.equal("samiyaakhtar");
                            });
                        }
                    }
                });
                expect(found5644).to.equal(true);
                expect(deployments.length).to.greaterThan(0);
            });
        });
    });
});