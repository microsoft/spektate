import { ObservableValue } from "azure-devops-ui/Core/Observable";
import { DropdownFilterBarItem } from "azure-devops-ui/Dropdown";
import { FilterBar } from "azure-devops-ui/FilterBar";
import { KeywordFilterBarItem } from "azure-devops-ui/TextFilterBarItem";
import { DropdownMultiSelection } from "azure-devops-ui/Utilities/DropdownSelection";
import {
  Filter,
  FILTER_CHANGE_EVENT /* FilterOperatorType */
} from "azure-devops-ui/Utilities/Filter";
import * as React from "react";
import "./css/dashboard.css";

export interface IDeploymentFilterProps {
  listOfServices: string[];
  listOfAuthors: Set<string>;
  listOfEnvironments: string[];
  onFiltered: (filterData: Filter) => void;
  filter: Filter;
}

export class DeploymentFilter extends React.Component<
  IDeploymentFilterProps,
  {}
> {
  private currentState = new ObservableValue("");

  constructor(props: IDeploymentFilterProps) {
    super(props);
    this.props.filter.subscribe(() => {
      this.currentState.value = JSON.stringify(
        this.props.filter.getState(),
        null,
        4
      );
      this.props.onFiltered(this.props.filter);
    }, FILTER_CHANGE_EVENT);
  }

  public render() {
    return <div>{this.createFilters()}</div>;
  }

  private createFilters = () => {
    return (
      <div className="FilterBar">
        <FilterBar filter={this.props.filter}>
          <KeywordFilterBarItem filterItemKey="keywordFilter" />
          <DropdownFilterBarItem
            filterItemKey="serviceFilter"
            filter={this.props.filter}
            items={this.props.listOfServices.map(i => {
              return {
                iconProps: { iconName: "Home" },
                id: i,
                text: i
              };
            })}
            selection={new DropdownMultiSelection()}
            placeholder="Filter by Service"
            noItemsText="No services found"
          />

          <DropdownFilterBarItem
            filterItemKey="authorFilter"
            filter={this.props.filter}
            items={Array.from(this.props.listOfAuthors).map(i => {
              return {
                iconProps: { iconName: "Contact" },
                id: i,
                text: i
              };
            })}
            selection={new DropdownMultiSelection()}
            placeholder="Filter by Author"
            noItemsText="No authors found"
          />

          <DropdownFilterBarItem
            filterItemKey="envFilter"
            filter={this.props.filter}
            items={this.props.listOfEnvironments.map(i => {
              return {
                iconProps: { iconName: "Globe" },
                id: i,
                text: i.toUpperCase()
              };
            })}
            selection={new DropdownMultiSelection()}
            placeholder="Filter by Ring"
            noItemsText="No environments found"
          />
        </FilterBar>
      </div>
    );
  };
}
