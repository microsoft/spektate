import * as deploymentService from "spektate/lib/IDeployment";
import * as config from "../config";
import { setProcessEnv } from "./common";
import { list } from "./deployments";
import { data as deploymentData } from "./deploymentsData";

beforeAll(() => {
  setProcessEnv();
});

describe("sanity test", () => {
  it("positive test", async () => {
    jest
      .spyOn(deploymentService, "getDeployments")
      .mockResolvedValueOnce(deploymentData as any);
    const result = await list();
    expect(result).toStrictEqual(deploymentData);
  });
  it("negative test", async () => {
    jest
      .spyOn(deploymentService, "getDeployments")
      .mockRejectedValue(Error("dummy"));
    await expect(list()).rejects.toThrow();
  });
  it("negative test: config error", async () => {
    jest.spyOn(config, "isValuesValid").mockReturnValueOnce(false);
    await expect(list()).rejects.toThrow();
  });
});
