import axios from 'axios';

export class HttpHelper {
    public static httpGet(theUrl: string, callback: (data: any) => void, promise?: Promise<void>)
    {
        axios.get(theUrl).then((response) => {
            callback(response);
          })
          .catch((error) => {
            console.log(error);
          });
    }
}