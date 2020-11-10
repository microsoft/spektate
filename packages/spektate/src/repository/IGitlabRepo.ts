import { HttpHelper } from "../HttpHelper";
import { IAuthor } from "./Author";
import { IPullRequest } from "./IPullRequest";
import { ITag } from "./Tag";

const commitsApi = "https://gitlab.com/api/v4/projects/{projectId}/repository/commits/{commitId}";
const prApi = "https://gitlab.com/api/v4/projects/{projectId}/merge_requests/{merge_request_iid}";
const manifestSyncTagsURL = "https://gitlab.com/api/v4/projects/{projectId}/repository/tags";
const releasesURL = "https://gitlab.com/api/v4/projects/{projectId}";
export interface IGitlabRepo {
  projectId: string;
}


export const getManifestSyncState = async (
  repository: IGitlabRepo,
  accessToken?: string
): Promise<ITag[]> => {
  const allTags = await HttpHelper.httpGet<any>(
    manifestSyncTagsURL
      .replace("{projectId}", repository.projectId),
    accessToken
  );
  if (allTags.status !== 200) {
    throw new Error(allTags.statusText);
  }

  const tags = allTags.data;
  const fluxTags: ITag[] = [];
  if (tags != null && tags.length > 0) {
    for (const tag of tags) {
      const clusterName = tag.name.replace("flux-", "");
      fluxTags.push({
        commit: tag.commit && tag.commit.id ? tag.commit.id.substring(0, 7) : "",
        date: tag.commit ? new Date(tag.commit.authored_date) : new Date(),
        message: tag.message,
        name: clusterName.toUpperCase(),
        tagger: tag.commit ? tag.commit.author_name : ""
      })
    }
  }
  return fluxTags;
}


export const getReleasesURL = async (repository: IGitlabRepo, accessToken?: string): Promise<string> => {
  const projectInfo = await HttpHelper.httpGet<any>(
    releasesURL
      .replace("{projectId}", repository.projectId),
    accessToken
  );
  return projectInfo.data.web_url + "/-/tags";
};


export const getPullRequest = async (
  repository: IGitlabRepo,
  pullRequestId: string,
  accessToken?: string
): Promise<IPullRequest | undefined> => {
  return new Promise(async (resolve, reject) => {
    try {
      const data = await HttpHelper.httpGet<any>(
        prApi
          .replace("{projectId}", repository.projectId)
          .replace("{merge_request_iid}", pullRequestId),
        accessToken
      );
      if (data.data) {
        const pr = data.data;
        resolve({
          description: pr.description,
          id: pr.iid,
          mergedBy: pr.merged_by
            ? {
              imageUrl: pr.merged_by.avatar_url
                ? pr.merged_by.avatar_url
                : "",
              name: pr.merged_by.name ? pr.merged_by.name : "",
              url: pr.merged_by.web_url ? pr.merged_by.web_url : "",
              username: pr.merged_by.username ? pr.merged_by.username : ""
            }
            : undefined,
          sourceBranch: pr.source_branch,
          targetBranch: pr.target_branch,
          title: pr.title,
          url: pr.web_url
        });
      } else {
        reject("No PR was found for " + pullRequestId);
      }
    } catch (e) {
      reject(e);
    }
  });
}


export const getAuthor = async (
  repository: IGitlabRepo,
  commitId: string,
  accessToken?: string
) => {
  const data = await HttpHelper.httpGet<any>(
    commitsApi
      .replace("{projectId}", repository.projectId)
      .replace("{commitId}", commitId),
    accessToken
  );

  if (data.status !== 200) {
    throw new Error(data.statusText);
  }

  const authorInfo = data.data;
  if (authorInfo != null) {
    const avatar = await HttpHelper.httpGet<any>(`https://gitlab.com/api/v4/avatar?email=${authorInfo.author_email}&size=32`);
    const author: IAuthor = {
      imageUrl: avatar.data != null ? avatar.data.avatar_url : "",
      name: authorInfo.author_name,
      url: authorInfo.web_url,
      username: authorInfo.author_email
    };
    return author;
  }
  return undefined;
}
