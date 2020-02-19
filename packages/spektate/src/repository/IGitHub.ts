import { HttpHelper } from "../HttpHelper";
import { IAuthor } from "./Author";
import { IRepository } from "./Repository";
import { ITag } from "./Tag";

const manifestSyncTagsURL =
  "https://api.github.com/repos/<owner>/<repo>/git/refs/tags";
const authorInfoURL =
  "https://api.github.com/repos/<owner>/<repo>/commits/<commitId>";

export interface IGitHub extends IRepository {
  username: string;
  reponame: string;
}

export const getManifestSyncState = (
  repository: IGitHub,
  accessToken?: string
): Promise<ITag[]> => {
  return new Promise(async (resolve, reject) => {
    try {
      const allTags = await HttpHelper.httpGet<any>(
        manifestSyncTagsURL
          .replace("<owner>", repository.username)
          .replace("<repo>", repository.reponame),
        accessToken
      );
      const tags = allTags.data;
      if (tags != null && tags.length > 0) {
        const fluxTags: ITag[] = [];
        for (const fluxTag of tags) {
          const data = await HttpHelper.httpGet<any>(
            fluxTag.url
              .replace("<owner>", repository.username)
              .replace("<repo>", repository.reponame),
            accessToken
          );

          const tag = data.data;
          if (tag != null) {
            const syncStatus = await HttpHelper.httpGet<any>(
              tag.object.url,
              accessToken
            );

            if (syncStatus != null) {
              const clusterName = syncStatus.data.tag.replace("flux-", "");
              const manifestSync = {
                commit: syncStatus.data.object.sha.substring(0, 7),
                date: new Date(syncStatus.data.tagger.date),
                message: syncStatus.data.message,
                name: clusterName.toUpperCase(),
                tagger: syncStatus.data.tagger.name
              };
              fluxTags.push(manifestSync);
            }
          }
        }
        resolve(fluxTags);
        return;
      }

      // No tags were found.
      resolve([]);
    } catch (err) {
      reject(err);
    }
  });
};

export const getReleasesURL = (repository: IGitHub): string => {
  return (
    "https://github.com/" +
    repository.username +
    "/" +
    repository.reponame +
    "/releases"
  );
};

export const getAuthor = async (
  repository: IGitHub,
  commitId: string,
  accessToken?: string
) => {
  const data = await HttpHelper.httpGet<any>(
    authorInfoURL
      .replace("<owner>", repository.username)
      .replace("<repo>", repository.reponame)
      .replace("<commitId>", commitId),
    accessToken
  );

  const authorInfo = data.data;
  if (authorInfo != null) {
    const author: IAuthor = {
      imageUrl: authorInfo.author ? authorInfo.author.avatar_url : "",
      name: authorInfo.commit.author.name,
      url: authorInfo.author ? authorInfo.author.html_url : "",
      username: authorInfo.committer ? authorInfo.committer.login : ""
    };
    return author;
  }
};
