/* tslint:disable */ 
import * as React from 'react';
import Request from 'react-http-request';

class Build extends React.Component {
    public render() {
        return this.getRecentInProgressBuild();
    }

    private getRecentInProgressBuild() {
        var requestUrl = 'https://dev.azure.com/epicstuff/services-team-bedrock/_apis/build/builds/api-version=5.0&definitions=51&queryOrder=finishTimeDescending&statusFilter=inProgress';
        return (
            <Request
                url={requestUrl}
                method='get fat'
                accept='application/json'
                verbose={true}
                headers={{'Authorization': 'Bearer'}}
            >
                {
                    // @ts-ignore
                    ({error, result, loading}) => {
                        if (loading) {
                            return <div>loading...</div>;
                        } else {
                            return <div>{ JSON.stringify(result) }</div>;
                        }
                    }
                }
            </Request>);
    }
}

export default Build;