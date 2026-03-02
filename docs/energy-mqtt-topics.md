# Energy meter MQTT topic pattern

For energy telemetry to be stored in InfluxDB with hierarchy tags (site, area, line, equipment), connector tags that are configured as energy meters **MUST** use a topic template that includes all hierarchy segments.

## Canonical topic template

Use this template for connector tag **MQTT Topic** when the tag is (or will be) an energy meter:

```
plant/{site}/{area}/{line}/{equipment}/{tag}
```

- **{site}** – Site name (from endpoint’s site)
- **{area}** – Area name (from endpoint’s area, or `default` if not set)
- **{line}** – Line name (from endpoint’s line, or `default` if not set)
- **{equipment}** – Equipment name (from endpoint’s equipment, or endpoint name)
- **{tag}** – Tag name (e.g. `kwh_total`, `power_kw`)

Segment values are slugified (lowercase, non-alphanumeric replaced with `_`) when resolving the topic.

## Example

- Site: `Plant1`, Area: `Production`, Line: `LineA`, Equipment: `MeterPanel`, Tag: `kwh_total`  
- Resolved topic: `plant/plant1/production/linea/meter_panel/kwh_total`

## Connector config

The connector loads config from `GET /api/connector/config`. Each tag’s `mqttTopic` is resolved using the endpoint’s hierarchy. To ensure energy meters get the correct topic:

1. When creating or editing a connector tag that will be used as an energy meter, set **MQTT Topic** to: `plant/{site}/{area}/{line}/{equipment}/{tag}` (or the same pattern with your placeholders).
2. After saving, designate the tag as an energy meter in **Settings → Connectors → Energy meters**.

The API `GET /api/connector/energy-meters` returns the list of energy meters with **resolved** `topic` and `meterType` for Telegraf or other consumers.

## Telegraf energy pipeline

To store energy telemetry in InfluxDB with measurement `energy` and tags `site`, `area`, `line`, `equipment`, `tag_name`:

1. Ensure connector tag **MQTT Topic** uses the pattern above so published topics look like `plant/site/area/line/equipment/tag`.
2. Run Telegraf with the energy config included, for example:
   ```bash
   telegraf --config telegraf.conf --config telegraf-energy.conf
   ```
   See `telegraf/telegraf-energy.conf` in this repo.

The energy config subscribes to `plant/#`, parses the topic with a regex into hierarchy tags, and writes to InfluxDB measurement `energy` (same bucket as historian). Only messages whose topic has exactly five segments after `plant/` are parsed; others are still written but may have empty hierarchy tags.

To restrict writes to **configured energy meters only**, fetch the allowlist and use it in your pipeline (e.g. generate a topic list from the API and filter in a custom processor or script):

```bash
curl -s "http://localhost:3000/api/connector/energy-meters" -o energy-meters.json
```

`energy-meters.json` is an array of `{ "topic", "meterType", "tagName" }`. You can use this file in a custom Telegraf execd script or in your own ingestion layer to add `meter_type` and filter by topic.

## Environment variables (Energy API and InfluxDB)

The Next.js API uses the following env vars for InfluxDB (same as the historian). Ensure they are set when running the frontend/API:

| Variable        | Description                    | Example                          |
|----------------|--------------------------------|----------------------------------|
| `INFLUX_URL`   | InfluxDB server URL           | `http://localhost:8086`          |
| `INFLUX_TOKEN` | InfluxDB API token             | `super-secret-auth-token`       |
| `INFLUX_ORG`   | InfluxDB organization          | `nexus-corp`                    |
| `INFLUX_BUCKET`| Bucket for historian/energy    | `historian`                     |

The Energy dashboard and `/api/energy/consumption`, `/api/energy/meters` use these to query the `energy` measurement. Telegraf must be run with `telegraf-energy.conf` (see above) so that data is written to the `energy` measurement with tags `site`, `area`, `line`, `equipment`.
