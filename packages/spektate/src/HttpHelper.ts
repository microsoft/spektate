import axios from "axios";

export class HttpHelper {
  public static httpGet<T>(
    theUrl: string,
    accessToken?: string,
    body?: string
  ) {
    console.log(`Making request to ${theUrl} for access token ${accessToken}`);

    return axios
      .get<T>(
        theUrl,
        accessToken
          ? {
            data: body,
            headers: {
              Authorization:
                "Basic " + Buffer.from(":" + accessToken).toString("base64")
            }
          }
          : {
            data: body,
            headers: {
              "Content-Type": "application/json"
            }
          }
      )
      .catch(error => {
        console.error(error);
        throw error;
      });
  }
}
