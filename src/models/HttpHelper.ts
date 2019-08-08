import axios from 'axios';

export class HttpHelper {
    public static httpGet(theUrl: string, callback: (data: any) => void, accessToken?: string)
    {
        axios.get(theUrl, accessToken ? {
            headers: {
                "Authorization": "Basic " + Buffer.from(":" + accessToken).toString('base64')
            }
        } : {}
        ).then((response) => {
            callback(response);
          })
          .catch((error) => {
            console.log(error);
          });
    }
}