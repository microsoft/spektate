import { AxiosResponse } from "axios";
import * as fs from "fs";
import { HttpHelper } from "../HttpHelper";
import { IAuthor } from "./Author";
import { GitHub } from "./GitHub";
import { ITag } from "./Tag";

let authorRawResponse = {};
let syncTagRawResponse = {};
let manifestSyncTagResponse = {};
let manifestResponse1 = {};
const mockDirectory = "src/repository/mocks/";
const repo = new GitHub("username", "reponame", "some-token");

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
});
jest.spyOn(HttpHelper, "httpGet").mockImplementation(
  <T>(theUrl: string, accessToken?: string): Promise<AxiosResponse<T>> => {
    if (theUrl.includes("096c95228c786715b14b0269a722a3de887c01bd")) {
      return getAxiosResponseForObject(manifestResponse1);
    } else if (theUrl.includes("commits")) {
      return getAxiosResponseForObject(authorRawResponse);
    } else if (theUrl.endsWith("refs/tags")) {
      return getAxiosResponseForObject(syncTagRawResponse);
    }
    return getAxiosResponseForObject(manifestSyncTagResponse);
  }
);

describe("GitHub", () => {
  test("gets author correctly", async () => {
    const author = await repo.getAuthor("commit");
    expect(author).toBeDefined();
    expect(author!.name).toBe("Edaena Salinas");
    expect(author!.url).toBeDefined();
    expect(author!.username).toBe("edaena");
    expect(author!.imageUrl).toBeTruthy();
  });
});

describe("GitHub", () => {
  test("gets manifest sync tag correctly", async () => {
    const tags = await repo.getManifestSyncState();
    expect(tags).toHaveLength(2);
    expect(tags[0].commit).toBe("57cb69b");
    expect(tags[0].tagger).toBeDefined();
    expect(tags[0].tagger).toBe("Weave Flux");
    expect(tags[0].name).toBe("ALASKA");
  });
});

describe("GitHub", () => {
  test("gets releases URL correctly", async () => {
    const releaseUrl = repo.getReleasesURL();
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
