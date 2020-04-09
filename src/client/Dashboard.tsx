import { Card } from "azure-devops-ui/Card";
import { ObservableValue } from "azure-devops-ui/Core/Observable";
import {
  ColumnFill,
  ITableColumn,
  SimpleTableCell,
  Table
} from "azure-devops-ui/Table";
import { Filter } from "azure-devops-ui/Utilities/Filter";
import { ArrayItemProvider } from "azure-devops-ui/Utilities/Provider";
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
import { ITag } from "spektate/lib/repository/Tag";
import { Build } from "./cells/build";
import { Cluster } from "./cells/cluster";
import { Persona } from "./cells/persona";
import { Simple } from "./cells/simple";
import { Status } from "./cells/status";
import { Time } from "./cells/time";
import "./css/dashboard.css";
import {
  IDashboardFilterState,
  IDashboardState,
  IDeploymentField
} from "./Dashboard.types";
import { DeploymentFilter } from "./DeploymentFilter";

const REFRESH_INTERVAL = 30000;
class Dashboard<Props> extends React.Component<Props, IDashboardState> {
  private interval: NodeJS.Timeout;
  private filter: Filter = new Filter();
  private filterState: IDashboardFilterState = {
    defaultApplied: false
  };
  private clusterSyncAvailable: boolean = false;
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
          this.renderPrototypeTable()
        )}
      </div>
    );
  }

  private updateDeployments = async () => {
    try {
      const deps = await HttpHelper.httpGet<any>("/api/deployments");
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
      HttpHelper.httpGet("/api/clustersync").then((syncData: any) => {
        if (syncData.data && syncData.data.tags && syncData.data.releasesURL) {
          this.setState({ manifestSyncStatuses: syncData.data.tags as ITag[] });
          this.releasesUrl = syncData.data.releasesURL;
        }
      });
    } catch (e) {
      console.log(e);
      this.setState({
        error: e
      });
    }
  };

  private renderPrototypeTable = () => {
    const columns: Array<ITableColumn<IDeploymentField>> = [
      {
        id: "status",
        name: "State",
        renderCell: this.renderDeploymentStatus,
        width: new ObservableValue(70)
      },
      {
        id: "service",
        name: "Service",
        renderCell: this.renderSimpleText,
        width: new ObservableValue(180)
      },
      {
        id: "environment",
        name: "Ring",
        renderCell: this.renderSimpleText,
        width: new ObservableValue(220)
      },
      {
        id: "authorName",
        name: "Author",
        renderCell: this.renderAuthor,
        width: new ObservableValue(200)
      },
      {
        id: "srcPipelineId",
        name: "SRC to ACR",
        renderCell: this.renderSrcBuild,
        width: new ObservableValue(200)
      },
      {
        id: "dockerPipelineId",
        name: "ACR to HLD",
        renderCell: this.renderDockerRelease,
        width: new ObservableValue(250)
      },
      {
        id: "pr",
        name: "Approval Pull Request",
        renderCell: this.renderPR,
        width: new ObservableValue(250)
      },
      {
        id: "mergedByName",
        name: "Merged By",
        renderCell: this.renderMergedBy,
        width: new ObservableValue(200)
      },
      {
        id: "hldPipelineId",
        name: "HLD to Manifest",
        renderCell: this.renderHldBuild,
        width: new ObservableValue(200)
      },
      {
        id: "deployedAt",
        name: "Last Updated",
        renderCell: this.renderTime,
        width: new ObservableValue(120)
      }
    ];

    // Display the cluster column only if there is information to show in the table
    if (this.clusterSyncAvailable) {
      columns.push({
        id: "clusterName",
        name: "Synced Cluster",
        renderCell: this.renderClusters,
        width: new ObservableValue(200)
      });
    }
    columns.push(ColumnFill);
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
      <div className="PrototypeTable">
        <Table
          columns={columns}
          pageSize={rows.length}
          role="table"
          itemProvider={new ArrayItemProvider<IDeploymentField>(rows)}
          showLines={true}
        />
      </div>
    );
  };

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

  private onDashboardFiltered = (filterData: Filter) => {
    this.filter = filterData;
    this.updateFilteredDeployments();
  };

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

  private updateQueryString(
    keywordFilter: string | undefined,
    serviceFilters: Set<string>,
    authorFilters: Set<string>,
    envFilters: Set<string>
  ) {
    const query: any = {};

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

  private getListOfEnvironments = (): string[] => {
    const envs: { [id: string]: boolean } = {};
    this.state.deployments.forEach((deployment: IDeployment) => {
      if (deployment.environment !== "" && !(deployment.environment in envs)) {
        envs[deployment.environment] = true;
      }
    });
    return Array.from(Object.keys(envs));
  };

  private getListOfServices = (): string[] => {
    const services: { [id: string]: boolean } = {};
    this.state.deployments.forEach((deployment: IDeployment) => {
      if (deployment.service !== "" && !(deployment.service in services)) {
        services[deployment.service] = true;
      }
    });
    return Array.from(Object.keys(services));
  };

  private getListOfAuthors = (): Set<string> => {
    return new Set(
      Array.from(Object.values(this.state.authors)).map(author => author.name)
    );
  };

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

  private renderSimpleText = (
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<IDeploymentField>,
    tableItem: IDeploymentField
  ): JSX.Element => {
    return (
      <Simple
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        text={tableItem[tableColumn.id]}
      />
    );
  };

  private renderTime = (
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<IDeploymentField>,
    tableItem: IDeploymentField
  ): JSX.Element => {
    return (
      <Time
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        deployment={tableItem}
      />
    );
  };

  private renderSrcBuild = (
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<IDeploymentField>,
    tableItem: IDeploymentField
  ): JSX.Element => {
    return (
      <Build
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        pipelineResult={tableItem.srcPipelineResult}
        pipelineId={tableItem.srcPipelineId}
        pipelineURL={tableItem.srcPipelineURL}
        commitId={tableItem.srcCommitId}
        commitURL={tableItem.srcCommitURL}
        iconName={"BranchPullRequest"}
      />
    );
  };

  private renderHldBuild = (
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<IDeploymentField>,
    tableItem: IDeploymentField
  ): JSX.Element => {
    return (
      <Build
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        pipelineResult={tableItem.hldPipelineResult}
        pipelineId={tableItem.hldPipelineId}
        pipelineURL={tableItem.hldPipelineURL}
        commitId={tableItem.hldCommitId}
        commitURL={tableItem.hldCommitURL}
        iconName={"BranchPullRequest"}
      />
    );
  };

  private renderDockerRelease = (
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<IDeploymentField>,
    tableItem: IDeploymentField
  ): JSX.Element => {
    return (
      <Build
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        pipelineResult={tableItem.dockerPipelineResult}
        pipelineId={tableItem.dockerPipelineId}
        pipelineURL={tableItem.dockerPipelineURL}
        commitId={tableItem.imageTag}
        commitURL={""}
        iconName={"Product"}
      />
    );
  };

  private renderPR = (
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<IDeploymentField>,
    tableItem: IDeploymentField
  ): JSX.Element => {
    if (tableItem.pr) {
      return (
        <Build
          columnIndex={columnIndex}
          tableColumn={tableColumn}
          pipelineResult={tableItem.mergedByName ? "succeeded" : "waiting"}
          pipelineId={tableItem.pr!.toString()}
          pipelineURL={tableItem.prURL}
          commitId={tableItem.prSourceBranch}
          commitURL={""}
          iconName={"BranchPullRequest"}
        />
      );
    } else {
      return (
        <SimpleTableCell key={"col-" + columnIndex} columnIndex={columnIndex}>
          -
        </SimpleTableCell>
      );
    }
  };

  private renderAuthor = (
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<IDeploymentField>,
    tableItem: IDeploymentField
  ): JSX.Element => {
    if (tableItem.authorName && tableItem.authorURL) {
      return (
        <Persona
          columnIndex={columnIndex}
          tableColumn={tableColumn}
          deployment={tableItem}
          name={tableItem.authorName}
          imageUrl={tableItem.authorURL}
        />
      );
    }
    return (
      <SimpleTableCell key={"col-" + columnIndex} columnIndex={columnIndex}>
        -
      </SimpleTableCell>
    );
  };

  private renderMergedBy = (
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<IDeploymentField>,
    tableItem: IDeploymentField
  ): JSX.Element => {
    if (tableItem.pr && tableItem.mergedByName) {
      return (
        <Persona
          columnIndex={columnIndex}
          tableColumn={tableColumn}
          deployment={tableItem}
          name={tableItem.mergedByName}
          imageUrl={tableItem.mergedByImageURL}
        />
      );
    }
    return (
      <SimpleTableCell key={"col-" + columnIndex} columnIndex={columnIndex}>
        -
      </SimpleTableCell>
    );
  };

  private renderClusters = (
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<IDeploymentField>,
    tableItem: IDeploymentField
  ): JSX.Element => {
    return (
      <Cluster
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        deployment={tableItem}
        releasesUrl={this.releasesUrl}
      />
    );
  };

  private renderDeploymentStatus = (
    rowIndex: number,
    columnIndex: number,
    tableColumn: ITableColumn<IDeploymentField>,
    tableItem: IDeploymentField
  ): JSX.Element => {
    return (
      <Status
        columnIndex={columnIndex}
        tableColumn={tableColumn}
        status={tableItem.status}
      />
    );
  };

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

  private getAuthors = () => {
    try {
      const state = this.state;
      const promises: Array<Promise<any>> = [];
      this.state.deployments.forEach(deployment => {
        const queryParams = this.getAuthorRequestParams(deployment);
        if (queryParams !== "") {
          const promise = HttpHelper.httpGet("/api/author?" + queryParams);

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

  private getPR = (deployment: IDeployment): IPullRequest | undefined => {
    if (deployment.pr && deployment.pr in this.state.prs) {
      return this.state.prs[deployment.pr];
    }
    return undefined;
  };
}

export default Dashboard;
