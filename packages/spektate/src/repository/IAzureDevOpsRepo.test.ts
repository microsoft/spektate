import { AxiosResponse } from "axios";
import * as fs from "fs";
import * as path from "path";
import { HttpHelper } from "../HttpHelper";
import { IAuthor } from "./Author";
import {
  getAuthor,
  getManifestSyncState,
  getPullRequest,
  getReleasesURL,
  IAzureDevOpsRepo
} from "./IAzureDevOpsRepo";
import { ITag } from "./Tag";

let authorRawResponse = {};
let syncTagRawResponse = {};
let manifestSyncTagResponse = {};
let prRawResponse = {};
const mockDirectory = path.join("src", "repository", "mocks");
const repo: IAzureDevOpsRepo = {
  org: "org",
  project: "project",
  repo: "repo"
};

beforeAll(() => {
  authorRawResponse = JSON.parse(
    fs.readFileSync(mockDirectory + "azdo-author-response.json", "utf-8")
  );
  syncTagRawResponse = JSON.parse(
    fs.readFileSync(mockDirectory + "azdo-sync-response.json", "utf-8")
  );
  manifestSyncTagResponse = JSON.parse(
    fs.readFileSync(
      mockDirectory + "azdo-manifest-sync-tag-response.json",
      "utf-8"
    )
  );
  prRawResponse = JSON.parse(
    fs.readFileSync(mockDirectory + "azdo-pr-response.json", "utf-8")
  );
});
jest.spyOn(HttpHelper, "httpGet").mockImplementation(
  <T>(theUrl: string, accessToken?: string): Promise<AxiosResponse<T>> => {
    if (theUrl.includes("commits")) {
      return getAxiosResponseForObject(authorRawResponse);
    } else if (theUrl.includes("annotatedtags")) {
      return getAxiosResponseForObject(manifestSyncTagResponse);
    } else if (theUrl.includes("pullrequests")) {
      return getAxiosResponseForObject(prRawResponse);
    }
    return getAxiosResponseForObject(syncTagRawResponse);
  }
);

describe("IAzureDevOpsRepo", () => {
  test("gets author correctly", async () => {
    const author = await getAuthor(repo, "commit");
    expect(author).toBeDefined();
    expect(author!.name).toBe("Samiya Akhtar");
    expect(author!.url).toBeDefined();
    expect(author!.username).toBe("saakhta@microsoft.com");
    expect(author!.imageUrl).toBeTruthy();
  });
});

describe("IAzureDevOpsRepo", () => {
  test("gets PR correctly", async () => {
    const pr = await getPullRequest(repo, "prid");
    expect(pr).toBeDefined();
    expect(pr.approvedBy).toBeDefined();
    expect(pr!.approvedBy!.name).toBe("Samiya Akhtar");
    expect(pr!.approvedBy!.username).toBe("saakhta@microsoft.com");
    expect(pr!.approvedBy!.url).toBeDefined();
    expect(pr!.approvedBy!.imageUrl).toBeDefined();
    expect(pr!.url).toBeDefined();
    expect(pr!.title).toBe(
      "Updating samiya.frontend image tag to master-20200317.12."
    );
    expect(pr!.sourceBranch).toBe(
      "DEPLOY/samiya2019-samiya.frontend-master-20200317.12"
    );
    expect(pr!.targetBranch).toBe("master");
    expect(pr!.id).toBe(1354);
    expect(pr!.description).toBeDefined();
  });
});

describe("IAzureDevOpsRepo", () => {
  test("gets manifest sync tag correctly", async () => {
    const tags = await getManifestSyncState(repo);
    expect(tags).toHaveLength(1);
    expect(tags[0].commit).toBe("ab4c9f1");
    expect(tags[0].name).toBe("SYNC");
  });
});

describe("IAzureDevOpsRepo", () => {
  test("gets releases URL correctly", async () => {
    const releaseUrl = getReleasesURL(repo);
    expect(releaseUrl).toBe("https://dev.azure.com/org/project/_git/repo/tags");
  });
});

const getAxiosResponseForObject = <T>(obj: any): Promise<AxiosResponse<T>> => {
  return new Promise(resolve => {
    const response: AxiosResponse<any> = {
      config: {},
      data: obj,
      headers: "",
      status: 200,
      statusText: ""
    };
    resolve(response);
  });
};
