import axios from "axios";

export class HttpHelper {
  public static httpGet<T>(theUrl: string, accessToken?: string) {
    return axios
      .get<T>(
        theUrl,
        accessToken
          ? {
              headers: {
                Authorization:
                  "Basic " + Buffer.from(":" + accessToken).toString("base64")
              }
            }
          : {}
      )
      .catch(error => {
        console.error(error);
        throw error;
      });
  }
  public static httpPost<T>(
    theUrl: string,
    body: string,
    accessToken?: string
  ) {
    return axios
      .post<T>(
        theUrl,
        body,
        accessToken
          ? {
              headers: {
                Authorization:
                  "Basic " + Buffer.from(":" + accessToken).toString("base64"),
                "Content-Type": "application/json"
              }
            }
          : {
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
