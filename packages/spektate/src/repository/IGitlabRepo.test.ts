import { AxiosResponse } from "axios";
import * as fs from "fs";
import * as path from "path";
import { HttpHelper } from "../HttpHelper";
import {
  getAuthor,
  getManifestSyncState,
  getPullRequest,
  getReleasesURL,
  IGitlabRepo
} from "./IGitlabRepo";


const mockDirectory = path.join("src", "repository", "mocks");
const repo: IGitlabRepo = {
  projectId: "42857398"
};

const mockResponse = (resp: any) => {
  jest.spyOn(HttpHelper, "httpGet").mockImplementation(
    <T>(theUrl: string, accessToken?: string): Promise<AxiosResponse<T>> => {
      return new Promise(resolve => {
        const response: AxiosResponse<any> = {
          config: {},
          data: resp,
          headers: "",
          status: 200,
          statusText: ""
        };
        resolve(response);
      });
    }
  );
};

describe("IGitlabRepo", () => {
  test("gets author correctly", async () => {
    mockResponse(JSON.parse(
      fs.readFileSync(path.join(mockDirectory, "gitlab-author-response.json"), "utf-8")
    ));
    const author = await getAuthor(repo, "67de8af");
    expect(author).toBeDefined();
    expect(author!.name).toBe("samiya akhtar");
    expect(author!.url).toBeDefined();
    expect(author!.username).toBe("samiyaakhtar7@gmail.com");
    jest.spyOn(HttpHelper, "httpGet").mockClear();
  });
  test("gets PR correctly", async () => {
    mockResponse(JSON.parse(
      fs.readFileSync(path.join(mockDirectory, "gitlab-pr-response.json"), "utf-8")
    ));
    const pr = await getPullRequest(repo, "4");
    expect(pr).toBeDefined();
    expect(pr?.mergedBy).toBeDefined();
    expect(pr!.mergedBy!.name).toBe("samiya akhtar");
    expect(pr!.mergedBy!.username).toBe("samiyaakhtar");
    expect(pr!.mergedBy!.url).toBeDefined();
    expect(pr!.mergedBy!.imageUrl).toBeDefined();
    expect(pr!.url).toBeDefined();
    expect(pr!.title).toBe(
      "automated"
    );
    expect(pr!.sourceBranch).toBe("DEPLOY/backend.208444041");
    expect(pr!.targetBranch).toBe("master");
    expect(pr!.id).toBe(5);
    expect(pr!.description).toBeDefined();
    jest.spyOn(HttpHelper, "httpGet").mockClear();
  });
  test("gets manifest sync tag correctly", async () => {
    mockResponse(JSON.parse(
      fs.readFileSync(path.join(mockDirectory, "gitlab-tags-response.json"), "utf-8")
    ));
    const tags = await getManifestSyncState(repo);
    expect(tags).toHaveLength(1);
    expect(tags[0].commit).toBe("a41c826");
    expect(tags[0].tagger).toBeDefined();
    expect(tags[0].tagger).toBe("Automated Account");
    expect(tags[0].name).toBe("EAST-US");
    jest.spyOn(HttpHelper, "httpGet").mockClear();
  });
  test("gets releases url correctly", async () => {
    mockResponse(JSON.parse(
      fs.readFileSync(path.join(mockDirectory, "gitlab-releasesurl-response.json"), "utf-8")
    ));
    const url = await getReleasesURL(repo);
    expect(url).toBeDefined();
    expect(url).toBe("https://gitlab.com/samiyaakhtar/hello-world-full-stack/-/tags")
    jest.spyOn(HttpHelper, "httpGet").mockClear();
  });
});