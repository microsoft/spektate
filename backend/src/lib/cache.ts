import { get as getAuthor } from "./author";
import { deepClone, IDeploymentData } from "./common";
import { list as listDeployments } from "./deployments";
import { get as getPullRequest } from "./pullRequest";

let cacheData: IDeploymentData[] = [];

/**
 * Populates author information to deployment.
 *
 * @param deployment Deployment instance
 */
export const fetchAuthor = async (
  deployment: IDeploymentData
): Promise<void> => {
  deployment.author = await getAuthor(deployment);
};

/**
 * Populates pull request information to deployment.
 *
 * @param deployment Deployment instance
 */
export const fetchPullRequest = async (
  deployment: IDeploymentData
): Promise<void> => {
  deployment.pullRequest = await getPullRequest(deployment);
};

/**
 * Updates cache where there are new instances.
 *
 * @param cache Cloned cache
 * @param newData latest deployments
 */
export const updateNewDeployment = async (
  cache: IDeploymentData[],
  newData: IDeploymentData[]
): Promise<void> => {
  const cacheIds = cache.map((d) => d.deploymentId);
  const newDeployments = newData.filter(
    (d) => cacheIds.indexOf(d.deploymentId) === -1
  );

  if (newDeployments.length > 0) {
    // reverse to keep the latest item to the top
    newDeployments.reverse().forEach((d) => {
      cache.unshift(d);
    });
    // For new deployments, always need to fetch author and pull request
    await Promise.all(newDeployments.map((d) => fetchAuthor(d)));
    await Promise.all(newDeployments.map((d) => fetchPullRequest(d)));
  }
};

/**
 * Purge cache where there are old instances
 *
 * @param cache Cloned cache
 * @param newData latest deployments
 */
export const updateOldDeployment = (
  cache: IDeploymentData[],
  newData: IDeploymentData[]
): IDeploymentData[] => {
  const cacheIds = newData.map((d) => d.deploymentId);
  return cache.filter((d) => cacheIds.indexOf(d.deploymentId) !== -1);
};

/**
 * Checks if deployment is eligible for quick refresh, if its timestamp has changed or
 * it was in progress or incomplete
 * @param oldDeployment deployment in cache
 * @param newDeployment newly fetched deployment
 */
export const isDeploymentChanged = (
  oldDeployment: IDeploymentData,
  newDeployment: IDeploymentData
): boolean => {
  return (
    newDeployment.timeStamp !== oldDeployment.timeStamp ||
    oldDeployment.status?.toLowerCase() !== "complete"
  );
};

/**
 * Replaces cache where there are changed instances
 *
 * @param cache Cloned cache
 * @param newData latest deployments
 */
export const updateChangedDeployment = async (
  cache: IDeploymentData[],
  newData: IDeploymentData[]
): Promise<void> => {
  const cacheIds = cache.map((d) => d.deploymentId);
  const cacheId2deployment = cache.reduce((a, c) => {
    a[c.deploymentId] = c;
    return a;
  }, {});
  cache.map((d) => d.deploymentId);
  const changed = newData.filter((d) => {
    if (cacheIds.indexOf(d.deploymentId) === -1) {
      return false;
    }
    // We want to update the deployments that have been updated or were in progress,
    // to reflect new changes in them
    return isDeploymentChanged(cacheId2deployment[d.deploymentId], d);
  });

  if (changed.length > 0) {
    changed.forEach((ch) => {
      const idx = cacheIds.indexOf(ch.deploymentId);
      cache.splice(idx, 1, ch);
    });

    // For changed deployments, fetch author only if it was empty, and PR only if
    // it wasn't closed (to pull merge updates)
    await Promise.all(
      changed.map((d) => {
        if (!cacheId2deployment[d.deploymentId].author) {
          fetchAuthor(d);
        } else {
          d.author = cacheId2deployment[d.deploymentId].author;
        }
      })
    );
    await Promise.all(
      changed.map((d) => {
        if (!cacheId2deployment[d.deploymentId].pullRequest?.mergedBy) {
          fetchPullRequest(d);
        } else {
          d.pullRequest = cacheId2deployment[d.deploymentId].pullRequest;
        }
      })
    );
  }
};

/**
 * Updates cache with latest deployments
 */
export const update = async () => {
  try {
    console.log("Updating cache");
    const latest = deepClone(await listDeployments());

    // clone the current cache data and do an atomic replace later.
    const clone = deepClone(cacheData);
    await updateChangedDeployment(clone, latest as IDeploymentData[]);
    await updateNewDeployment(clone, latest as IDeploymentData[]);
    cacheData = updateOldDeployment(clone, latest as IDeploymentData[]);
  } catch (e) {
    console.log(e);
  }
};

/**
 * Purges cache
 */
export const purge = () => {
  cacheData = [];
};

/**
 * Returns cached data
 */
export const fetch = () => {
  return cacheData;
};
