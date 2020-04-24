import { Card } from "azure-devops-ui/Card";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { Filter } from "azure-devops-ui/Utilities/Filter";
import * as React from "react";
import { HttpHelper } from "spektate/lib/HttpHelper";
import { endTime, IDeployment, status } from "spektate/lib/IDeployment";
import { IClusterSync, ITag } from "spektate/lib/repository/Tag";
import "./css/dashboard.css";
import {
  IDashboardFilterState,
  IDashboardState,
  IDeploymentData,
  IDeploymentField,
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
    defaultApplied: false,
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
      rowLimit: Number.parseInt(searchParams.get("limit") ?? "", 10) || 50, // default to 50 rows
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
      const deployments: IDeploymentData[] = deps.data as IDeploymentData[];
      this.processQueryParams();

      if (deployments.length === 0) {
        throw new Error("No deployments were found for this configuration.");
      }

      this.setState({
        deployments,
        error: undefined,
        filteredDeployments: this.state.deployments,
      });
      this.processQueryParams();
      this.updateFilteredDeployments();
      // this.getAuthors();
      // this.getPRs();
      if (!this.filterState.defaultApplied) {
        this.filter.setFilterItemState("authorFilter", {
          value: this.filterState.currentlySelectedAuthors,
        });
        this.filter.setFilterItemState("serviceFilter", {
          value: this.filterState.currentlySelectedServices,
        });
        this.filter.setFilterItemState("envFilter", {
          value: this.filterState.currentlySelectedEnvs,
        });
        this.filter.setFilterItemState("keywordFilter", {
          value: this.filterState.currentlySelectedKeyword,
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
        error: e,
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
          .map(this.getDeploymentToDisplay)
          .slice(0, this.state.rowLimit);
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
    deployment: IDeploymentData
  ): IDeploymentField => {
    console.log(deployment);
    const tags = this.getClusterSyncStatusForDeployment(deployment);
    const clusters: string[] = tags ? tags.map((itag) => itag.name) : [];
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
      authorName: deployment.author ? deployment.author.name : "",
      authorURL: deployment.author ? deployment.author.imageUrl : "",
      status:
        deployment.pullRequest && !deployment.pullRequest.mergedBy
          ? "waiting"
          : statusStr,
      clusters,
      endTime: endtime,
      manifestCommitId: deployment.manifestCommitId,
      pr: deployment.pullRequest ? deployment.pullRequest.id : undefined,
      prURL: deployment.pullRequest ? deployment.pullRequest.url : undefined,
      prSourceBranch: deployment.pullRequest
        ? deployment.pullRequest.sourceBranch
        : undefined,
      mergedByName: deployment.pullRequest
        ? deployment.pullRequest.mergedBy
          ? deployment.pullRequest.mergedBy.name
          : undefined
        : undefined,
      mergedByImageURL: deployment.pullRequest
        ? deployment.pullRequest.mergedBy
          ? deployment.pullRequest.mergedBy.imageUrl
          : undefined
        : undefined,
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
      filteredDeployments = filteredDeployments.filter((deployment) => {
        return JSON.stringify(deployment).includes(keywordFilter);
      });
    }

    if (serviceFilters.size > 0) {
      filteredDeployments = filteredDeployments.filter((deployment) => {
        return serviceFilters.has(deployment.service);
      });
    }

    if (authorFilters.size > 0) {
      filteredDeployments = filteredDeployments.filter((deployment) => {
        if (deployment.author) {
          return authorFilters.has(deployment.author!.name);
        }
        return false;
      });
    }

    if (envFilters.size > 0) {
      filteredDeployments = filteredDeployments.filter((deployment) => {
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
      Object.values(this.state.authors).map((author) => author.name)
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
    const clusterSyncs = statuses.filter((tag) => {
      return tag.commit === deployment.manifestCommitId;
    });
    if (!this.clusterSyncAvailable) {
      this.clusterSyncAvailable = clusterSyncs.length > 0;
    }

    return clusterSyncs;
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
