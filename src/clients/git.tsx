/* tslint:disable */ 
import * as React from 'react';
import Request from 'react-http-request';

export interface GitProps {
    user: string;
    repo: string;
}

class Git extends React.Component<GitProps, {}> {
    public render() {
        return <div className="git-commits">{ this.getCommits() }</div>;
    }

    // @ts-ignore
    private displayCommits(git_response) {
        var divs = [];
        var count = git_response.body.length > 15 ? 15 : git_response.body.length;
        for (let i = 0; i < count; i++) {
            divs.push(
                <div>
                    <a href={git_response.body[i]["html_url"]}><img src={ git_response.body[i]["author"]["avatar_url"] } /></a>
                    { git_response.body[i]["commit"]["message"] }
                </div>
            );
        }
        return divs;
    }

    private getCommits() {
        var requestUrl = 'https://api.github.com/repos/' + this.props.user + '/' + this.props.repo + '/commits';
        return (
            <Request
                url={requestUrl}
                method='get'
                accept='application/json'
                verbose={true}
            >
                {
                    // @ts-ignore
                    ({error, result, loading}) => {
                        if (loading) {
                        return <div>loading...</div>;
                        } else {
                        return this.displayCommits(result);
                        }
                    }
                }
            </Request>);
    }
}

export default Git;