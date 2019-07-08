import { Build } from "./Build";
abstract class Pipeline {

    public abstract getListOfBuilds(): Build[];
}

export default Pipeline;