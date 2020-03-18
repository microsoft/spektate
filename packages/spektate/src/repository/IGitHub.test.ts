import { AxiosResponse } from "axios";
import * as fs from "fs";
import { HttpHelper } from "../HttpHelper";
import {
  getAuthor,
  getManifestSyncState,
  getPullRequest,
  getReleasesURL,
  IGitHub
} from "./IGitHub";

let authorRawResponse = {};
let syncTagRawResponse = {};
let manifestSyncTagResponse = {};
let manifestResponse1 = {};
let prRawResponse = {};
const mockDirectory = "src/repository/mocks/";
const repo: IGitHub = {
  reponame: "reponame",
  username: "username"
};

beforeAll(() => {
  authorRawResponse = JSON.parse(
    fs.readFileSync(mockDirectory + "github-author-response.json", "utf-8")
  );
  syncTagRawResponse = JSON.parse(
    fs.readFileSync(mockDirectory + "github-sync-response.json", "utf-8")
  );
  manifestSyncTagResponse = JSON.parse(
    fs.readFileSync(
      mockDirectory + "github-manifest-sync-tag-response.json",
      "utf-8"
    )
  );
  manifestResponse1 = JSON.parse(
    fs.readFileSync(mockDirectory + "github-sync-response-1.json", "utf-8")
  );
  prRawResponse = JSON.parse(
    fs.readFileSync(mockDirectory + "github-pr-response.json", "utf-8")
  );
});
jest.spyOn(HttpHelper, "httpGet").mockImplementation(
  <T>(theUrl: string, accessToken?: string): Promise<AxiosResponse<T>> => {
    if (theUrl.includes("096c95228c786715b14b0269a722a3de887c01bd")) {
      return getAxiosResponseForObject(manifestResponse1);
    } else if (theUrl.includes("commits")) {
      return getAxiosResponseForObject(authorRawResponse);
    } else if (theUrl.endsWith("refs/tags")) {
      return getAxiosResponseForObject(syncTagRawResponse);
    } else if (theUrl.includes("pulls")) {
      return getAxiosResponseForObject(prRawResponse);
    }
    return getAxiosResponseForObject(manifestSyncTagResponse);
  }
);

describe("IGitHub", () => {
  test("gets author correctly", async () => {
    const author = await getAuthor(repo, "commit");
    expect(author).toBeDefined();
    expect(author!.name).toBe("Edaena Salinas");
    expect(author!.url).toBeDefined();
    expect(author!.username).toBe("edaena");
    expect(author!.imageUrl).toBeTruthy();
  });
});

describe("IGitHub", () => {
  test("gets PR correctly", async () => {
    const pr = await getPullRequest(repo, "prid");
    expect(pr).toBeDefined();
    expect(pr.approvedBy).toBeDefined();
    expect(pr!.approvedBy!.name).toBe("bnookala");
    expect(pr!.approvedBy!.username).toBe("bnookala");
    expect(pr!.approvedBy!.url).toBeDefined();
    expect(pr!.approvedBy!.imageUrl).toBeDefined();
    expect(pr!.url).toBeDefined();
    expect(pr!.title).toBe(
      "Updating all other pipelines to install helm2 prior to runnin steps"
    );
    expect(pr!.sourceBranch).toBe("helm-2-pipelines");
    expect(pr!.targetBranch).toBe("master");
    expect(pr!.id).toBe(408);
    expect(pr!.description).toBeDefined();
  });
});

describe("IGitHub", () => {
  test("gets manifest sync tag correctly", async () => {
    const tags = await getManifestSyncState(repo);
    expect(tags).toHaveLength(2);
    expect(tags[0].commit).toBe("57cb69b");
    expect(tags[0].tagger).toBeDefined();
    expect(tags[0].tagger).toBe("Weave Flux");
    expect(tags[0].name).toBe("ALASKA");
  });
});

describe("IGitHub", () => {
  test("gets releases URL correctly", async () => {
    const releaseUrl = getReleasesURL(repo);
    expect(releaseUrl).toBe("https://github.com/username/reponame/releases");
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
