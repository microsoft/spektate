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

export interface IDeploymentFilterProps {
  listOfServices: string[];
  listOfAuthors: Set<string>;
  listOfEnvironments: string[];
  onFiltered: (filterData: Filter) => void;
}

export class DeploymentFilter extends React.Component<
  IDeploymentFilterProps,
  {}
> {
  private filter: Filter;
  private currentState = new ObservableValue("");
  private selectionServiceList = new DropdownMultiSelection();
  private selectionAuthorList = new DropdownMultiSelection();
  private selectionEnvList = new DropdownMultiSelection();

  constructor(props: IDeploymentFilterProps) {
    super(props);
    this.filter = new Filter();
    this.filter.subscribe(() => {
      this.currentState.value = JSON.stringify(this.filter.getState(), null, 4);
      console.log(this.currentState.value);
      this.props.onFiltered(this.filter);
    }, FILTER_CHANGE_EVENT);
  }

  public render() {
    return <div>{this.createFilters()}</div>;
  }

  private createFilters = () => {
    return (
      <FilterBar filter={this.filter}>
        <KeywordFilterBarItem filterItemKey="keywordFilter" />

        <DropdownFilterBarItem
          filterItemKey="serviceFilter"
          filter={this.filter}
          items={this.props.listOfServices.map(i => {
            return {
              iconProps: { iconName: "Home" },
              id: i,
              text: i
            };
          })}
          selection={this.selectionServiceList}
          placeholder="Service"
          noItemsText="No services found"
        />

        <DropdownFilterBarItem
          filterItemKey="authorFilter"
          filter={this.filter}
          items={Array.from(this.props.listOfAuthors).map(i => {
            return {
              iconProps: { iconName: "Contact" },
              id: i,
              text: i
            };
          })}
          selection={this.selectionAuthorList}
          placeholder="Author"
          noItemsText="No authors found"
        />

        <DropdownFilterBarItem
          filterItemKey="envFilter"
          filter={this.filter}
          items={this.props.listOfEnvironments.map(i => {
            return {
              iconProps: { iconName: "Globe" },
              id: i,
              text: i.toUpperCase()
            };
          })}
          selection={this.selectionEnvList}
          placeholder="Environment"
          noItemsText="No environments found"
        />
      </FilterBar>
    );
  };
}
