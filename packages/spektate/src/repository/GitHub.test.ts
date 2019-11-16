import { AxiosResponse } from "axios";
import * as fs from "fs";
import { HttpHelper } from "../HttpHelper";
import { IAuthor } from "./Author";
import { GitHub } from "./GitHub";

let currentRawResponse = {};
const mockDirectory = "src/repository/mocks/";

jest.spyOn(HttpHelper, "httpGet").mockImplementation(
  <T>(theUrl: string, accessToken?: string): Promise<AxiosResponse<T>> => {
    return new Promise(resolve => {
      const response: AxiosResponse<any> = {
        config: {},
        data: currentRawResponse,
        headers: "",
        status: 200,
        statusText: ""
      };
      resolve(response);
    });
  }
);

describe("GitHub", () => {
  test("gets author correctly", () => {
    currentRawResponse = JSON.parse(
      fs.readFileSync(mockDirectory + "github-author-response.json", "utf-8")
    );
    const repo = new GitHub("username", "reponame", "some-token");
    repo.getAuthor("commit").then((author: IAuthor | undefined) => {
      expect(author).toBeDefined();
      expect(author!.name).toBe("Edaena Salinas");
      expect(author!.url).toBeDefined();
      expect(author!.username).toBe("edaena");
    });
  });
});
