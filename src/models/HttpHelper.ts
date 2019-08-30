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
        console.log(error);
        throw error;
      });
  }
}
