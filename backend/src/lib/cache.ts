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
    console.log(
      "Fetching new author and prs for " +
        newDeployments.length +
        " deployments"
    );
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

export const isDeploymentEligibleForQuickRefresh = (
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
    return isDeploymentEligibleForQuickRefresh(
      cacheId2deployment[d.deploymentId],
      d
    );
    //  d.timeStamp !== cacheId2deployment[d.deploymentId].timeStamp || cacheId2deployment[d.deploymentId].status?.toLowerCase() !== "complete";
  });
  console.log(changed.length);

  if (changed.length > 0) {
    changed.forEach((ch) => {
      const idx = cacheIds.indexOf(ch.deploymentId);
      cache.splice(idx, 1, ch);
    });
    console.log("Found " + changed.length + " incomplete deployments");

    await Promise.all(
      changed.map((d) => {
        if (!cacheId2deployment[d.deploymentId].author) {
          console.log("Not using author from cache for " + d.deploymentId);
          fetchAuthor(d);
        } else {
          console.log("Using author from cache for " + d.deploymentId);
          d.author = cacheId2deployment[d.deploymentId].author;
        }
      })
    );
    await Promise.all(
      changed.map((d) => {
        if (!cacheId2deployment[d.deploymentId].pullRequest?.mergedBy) {
          console.log("Not using pr from cache for " + d.pr);
          fetchPullRequest(d);
        } else {
          console.log("Using pr from cache for " + d.pr);
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
