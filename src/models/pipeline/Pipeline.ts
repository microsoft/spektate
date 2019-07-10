import { Build } from "./Build";
import { Release } from "./Release";
abstract class Pipeline {

    public abstract getListOfBuilds(): Build[];
    public abstract getListOfReleases(): Release[];
}

export default Pipeline;