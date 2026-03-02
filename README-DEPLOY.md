# Unified Namespace (UNS) Deployment Guide

This repository contains the configuration to deploy the complete MES/SCADA Unified Namespace stack using Docker Compose.

## Architecture Overview

The `docker-compose.yml` file orchestrates the following services:

1. **MonsterMQ (`monstermq`)**: The core MQTT broker acting as the Unified Namespace. It handles OT-IT data exchange, WebSockets for the UI, and persistence.
2. **PostgreSQL (`postgres`)**: The transactional database (Supabase equivalent) for MES data (Orders, Equipment Hierarchy, Users, Downtimes).
3. **InfluxDB (`influxdb`)**: The time-series historian for high-frequency tag data from the edge.
4. **Telegraf (`telegraf`)**: Subscribes to MonsterMQ and automatically writes edge data to InfluxDB.
5. **Redis (`redis`)**: Handles caching and BullMQ workflows for MES order dispatching.
6. **Bun API (`api`)**: The backend service (placeholder) that handles GraphQL queries, REST endpoints, and MES business logic.
7. **Next.js Frontend (`frontend`)**: The unified React interface for SCADA, MES, and Fleet Management.
8. **Industrial Connector (`connector`)**: Edge microservice that polls OPC UA, Modbus, and S7 PLCs and publishes to MQTT.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

## Deployment Instructions

### 1. Build and Start the Stack

To build the frontend image and start all services in detached mode, run:

```bash
docker-compose up -d --build
```

### 2. Verify Services

Check the status of the containers:

```bash
docker-compose ps
```

You should see all 5 containers (`uns-monstermq`, `uns-timescaledb`, `uns-redis`, `uns-bun-api`, `uns-frontend`) running.

### 3. Access the Application

- **Frontend UI**: Open your browser and navigate to `http://localhost:3000`
- **MQTT Broker**: Accessible on `localhost:1883` (TCP) and `localhost:9001` (WebSockets)
- **Postgres Database**: Accessible on `localhost:5432`

### 4. Stopping the Stack

To stop the services without removing the data volumes:

```bash
docker-compose stop
```

To stop and remove the containers, networks, and volumes (Warning: This will delete your database data):

```bash
docker-compose down -v
```

## Edge connector (per-site)

When running the industrial connector at a site (edge), set these environment variables so it connects to the platform and optionally scopes by site (ISA-95):

| Variable | Description | Example |
|----------|-------------|---------|
| `MQTT_URL` | Central broker URL (platform) | `mqtt://platform-host:1883` |
| `CONFIG_API_URL` | Platform API base URL | `http://platform-host:3000` |
| `EDGE_SITE_ID` | (Optional) Site UUID this edge serves; config and bridge topics are scoped to this site | UUID from Settings → Plants & Units |
| `EDGE_SITE_IDS` | (Optional) Comma-separated site UUIDs if one edge serves multiple sites | `uuid1,uuid2` |

**Bridge topics** (see [docs/architecture-edge-bridge.md](docs/architecture-edge-bridge.md)): status `edge/{siteId}/status`, config push `edge/{siteId}/config`, ack `edge/{siteId}/ack`. Use shared helpers in `lib/edge-topics.ts` for topic names. Identity follows ISA-95 site scope.

## Configuration Notes

- **Environment Variables**: The frontend is configured to connect to the WebSocket broker at `ws://localhost:9001`. If you deploy this to a remote server, update the `NEXT_PUBLIC_MQTT_WS_URL` in the `docker-compose.yml` file to point to your server's IP or domain.
- **Data Persistence**: The PostgreSQL database uses a named volume (`uns-pgdata`) to ensure your historian and MES data survives container restarts.
