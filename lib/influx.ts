import { InfluxDB, Point } from '@influxdata/influxdb-client';

const url = process.env.INFLUX_URL || 'http://localhost:8086';
const token = process.env.INFLUX_TOKEN || 'super-secret-auth-token';
const org = process.env.INFLUX_ORG || 'nexus-corp';
const bucket = process.env.INFLUX_BUCKET || 'historian';

// Singleton instance
export const influxDB = new InfluxDB({ url, token });

// Query API for reading historical data
export const queryApi = influxDB.getQueryApi(org);

// Write API for writing custom metrics (if needed outside of Telegraf)
export const writeApi = influxDB.getWriteApi(org, bucket);

/**
 * Helper function to query time-series data
 * @param fluxQuery The Flux query string
 * @returns Array of parsed rows
 */
export async function queryHistorian<T>(fluxQuery: string): Promise<T[]> {
  const rows: T[] = [];
  return new Promise((resolve, reject) => {
    queryApi.queryRows(fluxQuery, {
      next(row, tableMeta) {
        const o = tableMeta.toObject(row);
        rows.push(o as unknown as T);
      },
      error(error) {
        console.error('InfluxDB Query Error:', error);
        reject(error);
      },
      complete() {
        resolve(rows);
      },
    });
  });
}
