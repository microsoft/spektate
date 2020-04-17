import { AxiosResponse } from "axios";
import { Card } from "azure-devops-ui/Card";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Filter } from "azure-devops-ui/Utilities/Filter";
import * as querystring from "querystring";
import * as React from "react";
import { HttpHelper } from "spektate/lib/HttpHelper";
import {
  endTime,
  getRepositoryFromURL,
  IDeployment,
  status
} from "spektate/lib/IDeployment";
import { IAuthor } from "spektate/lib/repository/Author";
import { IAzureDevOpsRepo } from "spektate/lib/repository/IAzureDevOpsRepo";
import { IGitHub } from "spektate/lib/repository/IGitHub";
import { IPullRequest } from "spektate/lib/repository/IPullRequest";
import { IClusterSync, ITag } from "spektate/lib/repository/Tag";
import "./css/dashboard.css";
import {
  IDashboardFilterState,
  IDashboardState,
  IDeploymentField
} from "./Dashboard.types";
import { DeploymentFilter } from "./DeploymentFilter";
import { DeploymentTable } from "./DeploymentTable";

const REFRESH_INTERVAL = 30000;
class Dashboard<Props> extends React.Component<Props, IDashboardState> {
  /**
   * Interval timer that refreshes dashboard to update stale data
   */
  private interval: NodeJS.Timeout;

  /**
   * Filter for dashboard
   */
  private filter: Filter = new Filter();

  /**
   * Filter state of dashboard
   */
  private filterState: IDashboardFilterState = {
    defaultApplied: false
  };

  /**
   * Whether or not a cluster is synced to service(s) in this dashboard
   */
  private clusterSyncAvailable: boolean = false;

  /**
   * Redirect link for cluster sync releases page
   */
  private releasesUrl?: string;

  constructor(props: Props) {
    super(props);
    this.state = {
      authors: {},
      deployments: [],
      filteredDeployments: [],
      prs: {}
    };
  }

  public componentDidMount() {
    this.interval = setInterval(this.updateDeployments, REFRESH_INTERVAL);
    this.updateDeployments();
  }

  public componentWillUnmount() {
    clearInterval(this.interval);
  }

  /**
   * Render the dashboard
   */
  public render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title">Spektate</h1>
          <div className="App-last-update">
            <div>Last updated at {new Date().toLocaleTimeString()}</div>
          </div>
        </header>
        <DeploymentFilter
          filter={this.filter}
          onFiltered={this.onDashboardFiltered}
          listOfAuthors={this.getListOfAuthors()}
          listOfEnvironments={this.getListOfEnvironments()}
          listOfServices={this.getListOfServices()}
        />
        {this.state.error ? (
          <Card>{this.state.error.toString()}</Card>
        ) : (
          this.renderTable()
        )}
      </div>
    );
  }

  /**
   * Refresh deployments from storage
   */
  private updateDeployments = async () => {
    try {
      const deps = await HttpHelper.httpGet<IDeployment[]>("/api/deployments");
      if (!deps.data) {
        console.log(deps.request.response);
        throw new Error(deps.request.response);
      }
      const ideps: IDeployment[] = deps.data as IDeployment[];
      this.processQueryParams();
      const deployments: IDeployment[] = ideps.map(dep => {
        return {
          author: dep.author,
          commitId: dep.commitId,
          deploymentId: dep.deploymentId,
          dockerToHldRelease: dep.dockerToHldRelease,
          dockerToHldReleaseStage: dep.dockerToHldReleaseStage,
          environment: dep.environment,
          hldCommitId: dep.hldCommitId,
          hldRepo: dep.hldRepo,
          hldToManifestBuild: dep.hldToManifestBuild,
          imageTag: dep.imageTag,
          manifestCommitId: dep.manifestCommitId,
          manifestRepo: dep.manifestRepo,
          pr: dep.pr,
          service: dep.service,
          sourceRepo: dep.sourceRepo,
          srcToDockerBuild: dep.srcToDockerBuild,
          timeStamp: dep.timeStamp
        };
      });

      if (deployments.length === 0) {
        throw new Error("No deployments were found for this configuration.");
      }

      this.setState({
        deployments,
        error: undefined,
        filteredDeployments: this.state.deployments
      });
      this.processQueryParams();
      this.updateFilteredDeployments();
      this.getAuthors();
      this.getPRs();
      if (!this.filterState.defaultApplied) {
        this.filter.setFilterItemState("authorFilter", {
          value: this.filterState.currentlySelectedAuthors
        });
        this.filter.setFilterItemState("serviceFilter", {
          value: this.filterState.currentlySelectedServices
        });
        this.filter.setFilterItemState("envFilter", {
          value: this.filterState.currentlySelectedEnvs
        });
        this.filter.setFilterItemState("keywordFilter", {
          value: this.filterState.currentlySelectedKeyword
        });
      }
      const tags = await HttpHelper.httpGet<IClusterSync>("/api/clustersync");

      if (tags.data && tags.data.releasesURL) {
        this.setState({ manifestSyncStatuses: tags.data.tags as ITag[] });
        this.releasesUrl = tags.data.releasesURL;
      }
    } catch (e) {
      console.log(e);
      this.setState({
        error: e
      });
    }
  };

  /**
   * Renders table of deployments
   */
  private renderTable = () => {
    let rows: IDeploymentField[] = [];
    try {
      if (this.state.filteredDeployments.length === 0) {
        rows = new Array(15).fill(new ObservableValue(undefined));
      } else {
        rows = this.state.filteredDeployments.map(deployment => {
          return this.getDeploymentToDisplay(deployment);
        });
      }
    } catch (err) {
      console.error(err);
    }
    return (
      <DeploymentTable
        deploymentRows={rows}
        clusterSyncAvailable={this.clusterSyncAvailable}
        releasesUrl={this.releasesUrl}
      />
    );
  };

  /**
   * Gets the deployment field to display for a deployment from storage
   * @param deployment Deployment from storage
   */
  private getDeploymentToDisplay = (
    deployment: IDeployment
  ): IDeploymentField => {
    const author = this.getAuthor(deployment);
    const pr = this.getPR(deployment);
    const tags = this.getClusterSyncStatusForDeployment(deployment);
    const clusters: string[] = tags ? tags.map(itag => itag.name) : [];
    const statusStr = status(deployment);
    const endtime = endTime(deployment);
    return {
      deploymentId: deployment.deploymentId,
      service: deployment.service !== "" ? deployment.service : "-",
      startTime: deployment.srcToDockerBuild
        ? deployment.srcToDockerBuild.startTime
        : new Date(),
      // tslint:disable-next-line: object-literal-sort-keys
      imageTag: deployment.imageTag,
      srcCommitId: deployment.commitId,
      srcBranchName: deployment.srcToDockerBuild
        ? deployment.srcToDockerBuild.sourceBranch.replace("refs/heads/", "")
        : "-",
      srcCommitURL: deployment.srcToDockerBuild
        ? deployment.srcToDockerBuild.sourceVersionURL
        : "",
      srcPipelineId: deployment.srcToDockerBuild
        ? deployment.srcToDockerBuild.buildNumber
        : "",
      srcPipelineURL: deployment.srcToDockerBuild
        ? deployment.srcToDockerBuild.URL
        : "",
      srcPipelineResult: deployment.srcToDockerBuild
        ? deployment.srcToDockerBuild.result
        : "-",
      dockerPipelineId: deployment.dockerToHldRelease
        ? deployment.dockerToHldRelease.releaseName
        : deployment.dockerToHldReleaseStage
        ? deployment.dockerToHldReleaseStage.buildNumber
        : "",
      dockerPipelineURL: deployment.dockerToHldRelease
        ? deployment.dockerToHldRelease.URL
        : deployment.dockerToHldReleaseStage
        ? deployment.dockerToHldReleaseStage.URL
        : "",
      environment:
        deployment.environment !== ""
          ? deployment.environment.toUpperCase()
          : "-",
      dockerPipelineResult: deployment.dockerToHldRelease
        ? deployment.dockerToHldRelease.status
        : deployment.dockerToHldReleaseStage
        ? deployment.dockerToHldReleaseStage.result
        : "",
      hldCommitId: deployment.hldCommitId !== "" ? deployment.hldCommitId : "-",
      hldCommitURL: deployment.hldToManifestBuild
        ? deployment.hldToManifestBuild.sourceVersionURL
        : "",
      hldPipelineId: deployment.hldToManifestBuild
        ? deployment.hldToManifestBuild.buildNumber
        : "",
      hldPipelineResult: deployment.hldToManifestBuild
        ? deployment.hldToManifestBuild.result
        : "-",
      hldPipelineURL: deployment.hldToManifestBuild
        ? deployment.hldToManifestBuild.URL
        : "",
      duration: deployment.duration ? deployment.duration + " mins" : "",
      authorName: author ? author.name : "",
      authorURL: author ? author.imageUrl : "",
      status: pr && !pr.mergedBy ? "waiting" : statusStr,
      clusters,
      endTime: endtime,
      manifestCommitId: deployment.manifestCommitId,
      pr: pr ? pr.id : undefined,
      prURL: pr ? pr.url : undefined,
      prSourceBranch: pr ? pr.sourceBranch : undefined,
      mergedByName: pr
        ? pr.mergedBy
          ? pr.mergedBy.name
          : undefined
        : undefined,
      mergedByImageURL: pr
        ? pr.mergedBy
          ? pr.mergedBy.imageUrl
          : undefined
        : undefined
    };
  };

  /**
   * Handler for when dashboard is filtered
   */
  private onDashboardFiltered = (filterData: Filter) => {
    this.filter = filterData;
    this.updateFilteredDeployments();
  };

  /**
   * Filters deployments based on applied filters
   */
  private updateFilteredDeployments = () => {
    if (this.filter) {
      const keywordFilter: string | undefined = this.filter.getFilterItemValue(
        "keywordFilter"
      );

      const serviceFilters: Set<string> = new Set(
        this.filter.getFilterItemValue("serviceFilter")
      );
      const authorFilters: Set<string> = new Set(
        this.filter.getFilterItemValue("authorFilter")
      );
      const envFilters: Set<string> = new Set(
        this.filter.getFilterItemValue("envFilter")
      );

      this.updateQueryString(
        keywordFilter,
        serviceFilters,
        authorFilters,
        envFilters
      );
      this.filterDeployments(
        keywordFilter,
        serviceFilters,
        authorFilters,
        envFilters
      );
    }
  };

  /**
   * Updates query string based on filters
   * @param keywordFilter Applied filters in keyword textbox
   * @param serviceFilters Applied service filters
   * @param authorFilters Applied author filters
   * @param envFilters Applied env filters
   */
  private updateQueryString(
    keywordFilter: string | undefined,
    serviceFilters: Set<string>,
    authorFilters: Set<string>,
    envFilters: Set<string>
  ) {
    const query: { [id: string]: string[] | string } = {};

    if (keywordFilter && keywordFilter.length > 0) {
      query.keyword = keywordFilter;
    }

    if (serviceFilters.size > 0) {
      query.service = Array.from(serviceFilters);
    }

    if (authorFilters.size > 0) {
      query.author = Array.from(authorFilters);
    }

    if (envFilters.size > 0) {
      query.env = Array.from(envFilters);
    }

    if (history.replaceState) {
      const newurl =
        window.location.protocol +
        "//" +
        window.location.host +
        window.location.pathname +
        "?" +
        querystring.encode(query);

      window.history.replaceState({ path: newurl }, "", newurl);
    } else {
      window.location.search = querystring.encode(query);
    }
  }

  /**
   * Filters deployments
   * @param keywordFilter Applied filters in keyword textbox
   * @param serviceFilters Applied service filters
   * @param authorFilters Applied author filters
   * @param envFilters Applied env filters
   */
  private filterDeployments(
    keywordFilter: string | undefined,
    serviceFilters: Set<string>,
    authorFilters: Set<string>,
    envFilters: Set<string>
  ) {
    let filteredDeployments: IDeployment[] = this.state.deployments;

    if (keywordFilter && keywordFilter.length > 0) {
      filteredDeployments = filteredDeployments.filter(deployment => {
        return JSON.stringify(deployment).includes(keywordFilter);
      });
    }

    if (serviceFilters.size > 0) {
      filteredDeployments = filteredDeployments.filter(deployment => {
        return serviceFilters.has(deployment.service);
      });
    }

    if (authorFilters.size > 0) {
      filteredDeployments = filteredDeployments.filter(deployment => {
        if (deployment.author) {
          return authorFilters.has(deployment.author!.name);
        }
        return false;
      });
    }

    if (envFilters.size > 0) {
      filteredDeployments = filteredDeployments.filter(deployment => {
        return envFilters.has(deployment.environment);
      });
    }

    // to-do: remove sort by service
    // filteredDeployments.sort((a, b) =>a.service.localeCompare(b.service));
    // sort by ring
    filteredDeployments.sort((a, b) =>
      a.environment.localeCompare(b.environment)
    );

    this.setState({ filteredDeployments });
  }

  /**
   * Processes query parameters and applies it to filters
   */
  private processQueryParams = () => {
    if (window.location.search === "") {
      return;
    }

    const filters = querystring.decode(window.location.search.replace("?", ""));
    let keywordFilter: undefined | string;
    const authorFilters: Set<string> = this.getFilterSet("author");
    const serviceFilters: Set<string> = this.getFilterSet("service");
    const envFilters: Set<string> = this.getFilterSet("env");

    if (filters.keyword && filters.keyword !== "") {
      keywordFilter = filters.keyword.toString();
    }

    this.updateQueryString(
      keywordFilter,
      serviceFilters,
      authorFilters,
      envFilters
    );
    this.filterDeployments(
      keywordFilter,
      serviceFilters,
      authorFilters,
      envFilters
    );
  };

  /**
   * Gets a set of unique items for any filter drop down
   */
  private getFilterSet = (queryParam: string): Set<string> => {
    const filters = querystring.decode(window.location.search.replace("?", ""));
    let filterSet: Set<string> = new Set<string>();
    if (filters[queryParam] && filters[queryParam].length > 0) {
      if (typeof filters[queryParam] === "string") {
        filterSet.add(filters[queryParam] as string);
      } else {
        filterSet = new Set(filters[queryParam]);
      }
    }
    return filterSet;
  };

  /**
   * Gets a list of environments for filter drop down
   */
  private getListOfEnvironments = (): string[] => {
    const envs: { [id: string]: boolean } = {};
    this.state.deployments.forEach((deployment: IDeployment) => {
      if (deployment.environment !== "" && !(deployment.environment in envs)) {
        envs[deployment.environment] = true;
      }
    });
    return Array.from(Object.keys(envs));
  };

  /**
   * Gets a list of services for filter drop down
   */
  private getListOfServices = (): string[] => {
    const services: { [id: string]: boolean } = {};
    this.state.deployments.forEach((deployment: IDeployment) => {
      if (deployment.service !== "" && !(deployment.service in services)) {
        services[deployment.service] = true;
      }
    });
    return Array.from(Object.keys(services));
  };

  /**
   * Gets a list of authors for filter drop down
   */
  private getListOfAuthors = (): Set<string> => {
    return new Set(
      Array.from(Object.values(this.state.authors)).map(author => author.name)
    );
  };

  /**
   * Returns the appropriate cluster sync status for a deployment from loaded component state
   * @param deployment The deployment for which cluster sync state is to be fetched
   */
  private getClusterSyncStatusForDeployment = (
    deployment: IDeployment
  ): ITag[] | undefined => {
    const clusterSyncs: ITag[] = [];
    if (this.state.manifestSyncStatuses) {
      this.state.manifestSyncStatuses.forEach((tag: ITag) => {
        if (deployment.manifestCommitId === tag.commit) {
          this.clusterSyncAvailable = true;
          clusterSyncs.push(tag);
        }
      });
    }
    return clusterSyncs;
  };

  /**
   * Builds author query parameters for sending the HTTP request
   * @param deployment The deployment for which query parameters are to be built
   */
  private getAuthorRequestParams = (deployment: IDeployment) => {
    const query: { [key: string]: string } = {};
    const commit =
      deployment.srcToDockerBuild?.sourceVersion ||
      deployment.hldToManifestBuild?.sourceVersion;
    let repo: IAzureDevOpsRepo | IGitHub | undefined =
      deployment.srcToDockerBuild?.repository ||
      (deployment.sourceRepo
        ? getRepositoryFromURL(deployment.sourceRepo)
        : undefined);
    if (!repo && (deployment.hldToManifestBuild || deployment.hldRepo)) {
      repo =
        deployment.hldToManifestBuild!.repository ||
        (deployment.hldRepo
          ? getRepositoryFromURL(deployment.hldRepo)
          : undefined);
    }
    if (repo && "username" in repo && commit) {
      query.username = repo.username;
      query.reponame = repo.reponame;
      query.commit = commit;
    } else if (repo && "org" in repo && commit) {
      query.org = repo.org;
      query.project = repo.project;
      query.repo = repo.repo;
      query.commit = commit;
    }
    return Object.keys(query)
      .map(k => `${k}=${encodeURIComponent(query[k])}`)
      .join("&");
  };

  /**
   * Builds PR query parameters for sending the HTTP request
   * @param deployment The deployment for which query parameters are to be built
   */
  private getPRRequestParams = (deployment: IDeployment) => {
    const query: { [key: string]: string } = {};
    if (!deployment.hldRepo) {
      return "";
    }
    const repo: IAzureDevOpsRepo | IGitHub | undefined = getRepositoryFromURL(
      deployment.hldRepo
    );
    if (repo && "username" in repo && deployment.pr) {
      query.username = repo.username;
      query.reponame = repo.reponame;
      query.pr = deployment.pr!.toString();
    } else if (repo && "org" in repo && deployment.pr) {
      query.org = repo.org;
      query.project = repo.project;
      query.repo = repo.repo;
      query.pr = deployment.pr!.toString();
    }

    return Object.keys(query)
      .map(k => `${k}=${encodeURIComponent(query[k])}`)
      .join("&");
  };

  /**
   * Fetches PRs for all deployments asynchronously
   */
  private getPRs = () => {
    try {
      const state = this.state;
      this.state.deployments.forEach(deployment => {
        if (deployment.pr) {
          const queryParams = this.getPRRequestParams(deployment);
          if (queryParams !== "") {
            HttpHelper.httpGet("/api/pr?" + queryParams).then(data => {
              const pr = data.data as IPullRequest;
              if (pr && deployment.pr) {
                const copy = state.prs;
                copy[deployment.pr] = pr;
                this.setState({ prs: copy });
                this.updateFilteredDeployments();
              }
            });
          }
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Sends requests to fetch all authors asynchronously
   */
  private getAuthors = () => {
    try {
      const state = this.state;
      const promises: Array<Promise<AxiosResponse<IAuthor>>> = [];
      this.state.deployments.forEach(deployment => {
        const queryParams = this.getAuthorRequestParams(deployment);
        if (queryParams !== "") {
          const promise = HttpHelper.httpGet<IAuthor>(
            "/api/author?" + queryParams
          );

          promise.then(data => {
            const author = data.data as IAuthor;
            if (author && deployment.srcToDockerBuild) {
              const copy = state.authors;
              copy[deployment.srcToDockerBuild.sourceVersion] = author;
              this.setState({ authors: copy });
              this.updateFilteredDeployments();
            } else if (author && deployment.hldToManifestBuild) {
              const copy = state.authors;
              copy[deployment.hldToManifestBuild.sourceVersion] = author;
              this.setState({ authors: copy });
              this.updateFilteredDeployments();
            }
          });
          promises.push(promise);
        }
      });

      Promise.all(promises).then(() => {
        if (!this.filterState.defaultApplied) {
          this.filter.setFilterItemState("authorFilter", {
            value: this.filterState.currentlySelectedAuthors
          });
          this.filterState.defaultApplied = true;
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Returns author from loaded component state, if available
   * @param deployment the deployment for which author is being requested
   */
  private getAuthor = (deployment: IDeployment): IAuthor | undefined => {
    if (
      deployment.srcToDockerBuild &&
      deployment.srcToDockerBuild.sourceVersion in this.state.authors
    ) {
      deployment.author = this.state.authors[
        deployment.srcToDockerBuild.sourceVersion
      ];
      return this.state.authors[deployment.srcToDockerBuild.sourceVersion];
    } else if (
      deployment.hldToManifestBuild &&
      deployment.hldToManifestBuild.sourceVersion in this.state.authors
    ) {
      deployment.author = this.state.authors[
        deployment.hldToManifestBuild.sourceVersion
      ];
      return this.state.authors[deployment.hldToManifestBuild.sourceVersion];
    }
    return undefined;
  };

  /**
   * Returns PR from component state, if available
   * @param deployment the deployment for which PR is being requested
   */
  private getPR = (deployment: IDeployment): IPullRequest | undefined => {
    if (deployment.pr && deployment.pr in this.state.prs) {
      return this.state.prs[deployment.pr];
    }
    return undefined;
  };
}

export default Dashboard;
