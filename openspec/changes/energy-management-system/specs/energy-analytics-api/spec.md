## ADDED Requirements

### Requirement: API returns aggregated energy data by time range and hierarchy

The system SHALL provide an API that returns aggregated energy consumption data from InfluxDB for a given time range and hierarchy level (line, area, site, or multi-plant). The API SHALL accept parameters for start time, end time, hierarchy level, and optional filters (e.g. siteId, areaId, lineId) and SHALL return time series or aggregated values suitable for the dashboard and visualization.

#### Scenario: Request consumption for a line

- **WHEN** a client calls the API with a time range and a line identifier (or hierarchy level "line")
- **THEN** the API returns energy data (e.g. time-bucketed series or totals) for that line for the given range

#### Scenario: Request consumption for an area

- **WHEN** a client calls the API with a time range and an area identifier (or hierarchy level "area")
- **THEN** the API returns energy data aggregated for that area for the given range

#### Scenario: Request consumption for a site (plant)

- **WHEN** a client calls the API with a time range and a site identifier (or hierarchy level "site")
- **THEN** the API returns energy data aggregated for that site for the given range

#### Scenario: Request consumption for multi-plant

- **WHEN** a client calls the API with a time range and multi-plant (or "all sites") scope
- **THEN** the API returns energy data aggregated across all sites (or those the user is allowed to see) for the given range

#### Scenario: Invalid or missing time range is rejected

- **WHEN** a client calls the API without a valid time range (e.g. missing start or end, or end before start)
- **THEN** the API returns a validation error and does not execute the InfluxDB query

### Requirement: API returns list of configured energy meters when needed

The system SHALL provide an API (or extend an existing one) to return the list of configured energy meters, optionally filtered by site, area, or line, so that the dashboard can display meter metadata and build hierarchy selectors.

#### Scenario: List energy meters for a site

- **WHEN** a client requests energy meters for a given site
- **THEN** the API returns all energy meter configurations whose endpoint belongs to that site, with hierarchy and meter type

#### Scenario: List energy meters for dashboard hierarchy selector

- **WHEN** the dashboard needs to populate a dropdown or tree for line/area/site selection
- **THEN** the API can return meters or hierarchy nodes so the UI can build the selector and request consumption for the selected scope

### Requirement: Energy API respects authorization

The system SHALL apply the same authorization rules as other dashboard/API endpoints (e.g. restrict data to sites or areas the user is allowed to access). Results SHALL NOT include data from hierarchy levels the user is not permitted to see.

#### Scenario: User restricted to one site

- **WHEN** a user with access only to site A requests multi-plant data
- **THEN** the API returns only data for site A (or an empty/forbidden response for other sites)

#### Scenario: User with no site restriction

- **WHEN** a user with access to all sites requests multi-plant data
- **THEN** the API returns aggregated data for all sites (or all sites they are allowed to see)
