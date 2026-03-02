## ADDED Requirements

### Requirement: Energy dashboard shows consumption by hierarchy level

The system SHALL provide a dedicated energy dashboard that displays consumption (e.g. kWh, kW) at multiple hierarchy levels: by line, by section (area), by plant (site), and for multiple plants (multi-plant rollup). The dashboard SHALL allow the user to select the level of aggregation and SHALL show a comprehensive view suitable for operations and site managers.

#### Scenario: User selects line-level view

- **WHEN** the user selects a line (or "by line" view)
- **THEN** the dashboard shows energy consumption for that line (aggregated from equipment/line meters) with the chosen time range and visualizations

#### Scenario: User selects section (area) level view

- **WHEN** the user selects an area or "by section" view
- **THEN** the dashboard shows energy consumption aggregated for that area (across its lines) with the chosen time range

#### Scenario: User selects plant (site) level view

- **WHEN** the user selects a site or "by plant" view
- **THEN** the dashboard shows energy consumption aggregated for that site with the chosen time range

#### Scenario: User selects multi-plant view

- **WHEN** the user selects multi-plant or "all sites" view
- **THEN** the dashboard shows rolled-up energy consumption across all configured sites (or those the user is allowed to see) with the chosen time range

### Requirement: Time range selection for energy data

The dashboard SHALL allow the user to select a time range (e.g. last 24 hours, last 7 days, custom range) and SHALL request and display energy data for that range only.

#### Scenario: User picks a preset time range

- **WHEN** the user selects a preset (e.g. "Last 24 hours", "Last 7 days")
- **THEN** the dashboard refreshes to show energy data for that range

#### Scenario: User picks a custom time range

- **WHEN** the user selects a custom start and end date/time
- **THEN** the dashboard requests and displays energy data for that range

### Requirement: Dashboard includes visualizations for trends and comparison

The dashboard SHALL include at least one visualization that shows energy over time (trend) and SHALL support comparison across hierarchy elements (e.g. lines within an area, sites in multi-plant) where applicable.

#### Scenario: Trend chart shows energy over time

- **WHEN** the user views the dashboard for a chosen hierarchy level and time range
- **THEN** at least one chart or graph displays energy (e.g. kWh or kW) over time for the selected scope

#### Scenario: Comparison across entities at same level

- **WHEN** the user views an area or site that has multiple lines or areas
- **THEN** the dashboard can show a comparison (e.g. stacked or grouped series) of consumption across those entities for the selected time range
