# Site hierarchy (ISA-95 / IEC 62264)

The platform uses a single, persisted equipment hierarchy aligned with **ISA-95** (ANSI/ISA-95 / IEC 62264).

## Model mapping

| Level    | DB model  | ISA-95 equivalent        |
| -------- | --------- | ------------------------- |
| Site     | `Site`    | Site (physical/logical)   |
| Area     | `Area`    | Area                      |
| Line     | `Line`    | Work Center / Production Line |
| Equipment| `Equipment` | Work Unit / equipment element |

All services (Energy, Trend, Connectors, etc.) use this hierarchy as the single source of truth. Hierarchy is stored in the database and managed via Settings > Plants & Units (site list, edit/add site, Manage structure for areas/lines/equipment).

## References

- ISA-95: Enterprise-Control System Integration
- IEC 62264: Enterprise-control system integration
