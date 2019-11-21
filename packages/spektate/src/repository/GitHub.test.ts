import { AxiosResponse } from "axios";
import * as fs from "fs";
import { HttpHelper } from "../HttpHelper";
import { IAuthor } from "./Author";
import { GitHub } from "./GitHub";
import { ITag } from "./Tag";

let authorRawResponse = {};
let syncTagRawResponse = {};
let manifestSyncTagResponse = {};
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
});
jest.spyOn(HttpHelper, "httpGet").mockImplementation(
  <T>(theUrl: string, accessToken?: string): Promise<AxiosResponse<T>> => {
    if (theUrl.includes("commits")) {
      return getAxiosResponseForObject(authorRawResponse);
    } else if (theUrl.includes("flux-sync")) {
      return getAxiosResponseForObject(syncTagRawResponse);
    }
    return getAxiosResponseForObject(manifestSyncTagResponse);
  }
);

describe("GitHub", () => {
  test("gets author correctly", () => {
    repo.getAuthor("commit").then((author: IAuthor | undefined) => {
      expect(author).toBeDefined();
      expect(author!.name).toBe("Edaena Salinas");
      expect(author!.url).toBeDefined();
      expect(author!.username).toBe("edaena");
      expect(author!.imageUrl).toBeTruthy();
    });
  });
});

describe("GitHub", () => {
  test("gets manifest sync tag correctly", () => {
    repo.getManifestSyncState().then((tag: ITag) => {
      expect(tag.commit).toBe("096c952");
      expect(tag.tagger).toBeDefined();
      expect(tag.tagger).toBe("Weave Flux");
    });
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
