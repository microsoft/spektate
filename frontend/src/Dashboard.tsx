import { Card } from "azure-devops-ui/Card";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Filter } from "azure-devops-ui/Utilities/Filter";
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

  public constructor(props: Props) {
    super(props);
    const searchParams = new URLSearchParams(location.search);
    this.state = {
      authors: {},
      deployments: [],
      filteredDeployments: [],
      prs: {},
      refreshRate: Number.parseInt(searchParams.get("refresh") ?? "", 10) || 30, // default to 30 seconds
      rowLimit: Number.parseInt(searchParams.get("limit") ?? "", 10) || 50 // default to 50 rows
    };
  }

  public componentDidMount() {
    this.startRefreshLoop();
  }

  public componentDidUpdate(prevProps: Props, prevState: IDashboardState) {
    // update refresh loop if changed
    if (this.state.refreshRate !== prevState.refreshRate) {
      this.startRefreshLoop();
    }
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
      const deployments: IDeployment[] = deps.data as IDeployment[];
      this.processQueryParams();

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
        rows = this.state.filteredDeployments
          .slice(0, this.state.rowLimit)
          .map(this.getDeploymentToDisplay);
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
    const setParams = (
      params: URLSearchParams,
      name: string,
      values: Set<string> | string
    ): void => {
      params.delete(name);
      const hasValue =
        typeof values === "string" ? values.length > 0 : values.size > 0;

      if (hasValue) {
        if (typeof values === "string") {
          params.append(name, values);
        } else {
          for (const value of values) {
            params.append(name, value);
          }
        }
      }
    };
    const searchParams = new URLSearchParams(location.search);
    setParams(searchParams, "keyword", keywordFilter ?? "");
    setParams(searchParams, "service", serviceFilters);
    setParams(searchParams, "author", authorFilters);
    setParams(searchParams, "env", envFilters);
    setParams(searchParams, "limit", this.state.rowLimit.toString());
    setParams(searchParams, "refresh", this.state.refreshRate.toString());

    if (history.replaceState) {
      const newUrl = window.location.pathname + "?" + searchParams.toString();
      // only update history if a the new path doesn't match the current one
      if (!window.location.href.endsWith(newUrl)) {
        window.history.replaceState({ path: newUrl }, "", newUrl);
      }
    } else {
      window.location.search = searchParams.toString();
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

    this.setState({ filteredDeployments });
  }

  /**
   * Processes query parameters and applies it to filters
   */
  private processQueryParams = () => {
    if (location.search.substring(1) === "") {
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    const keywordFilter = searchParams.get("keyword") ?? undefined;
    const authorFilters: Set<string> = this.getFilterSet("author");
    const serviceFilters: Set<string> = this.getFilterSet("service");
    const envFilters: Set<string> = this.getFilterSet("env");

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
    const searchParams = new URLSearchParams(location.search);
    const params = searchParams.getAll(queryParam);
    const filterSet = new Set(params);

    return filterSet;
  };

  /**
   * Gets a list of environments for filter drop down
   */
  private getListOfEnvironments = (): string[] => {
    const environments = this.state.deployments.reduce((acc, dep) => {
      return dep.environment ? acc.add(dep.environment) : acc;
    }, new Set<string>());

    return [...environments];
  };

  /**
   * Gets a list of services for filter drop down
   */
  private getListOfServices = (): string[] => {
    const services = this.state.deployments.reduce((acc, dep) => {
      return dep.service ? acc.add(dep.service) : acc;
    }, new Set<string>());

    return [...services];
  };

  /**
   * Gets a list of authors for filter drop down
   */
  private getListOfAuthors = (): Set<string> => {
    return new Set(
      Object.values(this.state.authors).map(author => author.name)
    );
  };

  /**
   * Returns the appropriate cluster sync status for a deployment from loaded component state
   * @param deployment The deployment for which cluster sync state is to be fetched
   */
  private getClusterSyncStatusForDeployment = (
    deployment: IDeployment
  ): ITag[] | undefined => {
    const statuses = this.state.manifestSyncStatuses ?? [];
    const clusterSyncs = statuses.filter(tag => {
      return tag.commit === deployment.manifestCommitId;
    });
    if (!this.clusterSyncAvailable) {
      this.clusterSyncAvailable = clusterSyncs.length > 0;
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
      const authors = Object.entries(
        this.state.deployments.reduce<{
          [query: string]: IDeployment[];
        }>((acc, deployment) => {
          const authorQuery = this.getAuthorRequestParams(deployment);
          return {
            ...acc,
            [authorQuery]: [...(acc[authorQuery] ?? []), deployment]
          };
        }, {})
      ).map(([query, deployments]) => ({ query, deployments }));

      const requests = authors.map(async ({ query, deployments }) => {
        const response = await HttpHelper.httpGet<IAuthor>(
          "/api/author?" + query
        );
        const author = response.data;
        const newAuthorEntries = deployments
          .map(d => {
            return d.srcToDockerBuild
              ? { [d.srcToDockerBuild.sourceVersion]: author }
              : d.hldToManifestBuild
              ? { [d.hldToManifestBuild.sourceVersion]: author }
              : undefined;
          })
          .filter((e): e is NonNullable<typeof e> => !!e)
          .reduce((acc, entry) => {
            return { ...acc, ...entry };
          }, {});

        this.setState({
          authors: { ...this.state.authors, ...newAuthorEntries }
        });
        this.updateFilteredDeployments();
        return;
      });

      Promise.all(requests).then(() => {
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

  /**
   * Starts the polling loop to refresh deployments
   * - This clears previously started refresh timeout.
   */
  private startRefreshLoop = async () => {
    clearTimeout(this.interval);
    await this.updateDeployments();
    this.interval = setTimeout(
      this.startRefreshLoop,
      this.state.refreshRate * 1000
    );
  };
}

export default Dashboard;
