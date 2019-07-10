// import { Build } from "./pipeline/Build";
import Pipeline from "./pipeline/Pipeline";
// import { Release } from "./pipeline/Release";

export class Deployment {
    public deploymentId: string;
    public srcPipeline: Pipeline;
    public acrPipeline: Pipeline;
    public hldPipeline: Pipeline;
    public startTime: string;
    public endTime: string;
    public status: string;

    constructor(deploymentId: string, srcPipeline: Pipeline, acrPipeline: Pipeline, hldPipeline: Pipeline, startTime: string, endTime: string, status: string) {
        this.status = status;
        this.startTime = startTime;
        this.srcPipeline = srcPipeline;
        this.hldPipeline = hldPipeline;
        this.endTime = endTime;
        this.deploymentId = deploymentId;
        this.acrPipeline = acrPipeline;
    }
}