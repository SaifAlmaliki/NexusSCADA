## ADDED Requirements

### Requirement: Energy meter configuration is stored and linked to hierarchy

The system SHALL persist which connector tags are energy meters and their meter type (e.g. kWh, kW, power factor). Each energy meter configuration SHALL be associated with exactly one connector tag and SHALL inherit the hierarchy (site, area, line, equipment) from that tag’s connector endpoint.

#### Scenario: Create energy meter from connector tag

- **WHEN** a user configures a connector tag as an energy meter and selects a meter type (e.g. kWh)
- **THEN** the system stores the association (tag id, meter type) and uses the endpoint’s site/area/line/equipment for all energy telemetry and queries

#### Scenario: List energy meters for a hierarchy level

- **WHEN** a client requests energy meters for a given site, area, or line
- **THEN** the system returns all configured energy meters whose endpoint belongs to that hierarchy level (and children where applicable)

#### Scenario: Remove energy meter configuration

- **WHEN** a user removes the energy meter designation from a tag
- **THEN** the system stops treating that tag’s telemetry as energy for new writes; existing time series data in InfluxDB is unchanged

### Requirement: Meter types are constrained and identifiable

The system SHALL support a defined set of meter types (at least kWh, kW, and power factor) and SHALL store and expose the meter type for each energy meter so that analytics and dashboard can aggregate and label by type.

#### Scenario: Valid meter type required

- **WHEN** a user saves an energy meter with a meter type not in the allowed set
- **THEN** the system rejects the request and returns a validation error

#### Scenario: Dashboard can filter or label by meter type

- **WHEN** the dashboard or API requests consumption data
- **THEN** the system can return data filtered or labeled by meter type (e.g. only kWh, or separate series for kW vs kWh)
