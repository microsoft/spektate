import axios from 'axios';

export class HttpHelper {
    public static httpGet(theUrl: string, callback: (data: any) => void)
    {
        axios.get(theUrl).then((response) => {
            // handle success
            callback(response);
          })
          .catch((error) => {
            // handle error
            // tslint:disable-next-line: no-console
            console.log(error);
          });
    }
}