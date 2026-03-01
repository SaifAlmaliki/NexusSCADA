import { ModbusTCPClient } from 'jsmodbus';
import { Socket } from 'net';

export interface ModbusTag {
  name: string;
  address: number;
  length: number;
  type: 'holding' | 'input' | 'coil' | 'discrete';
}

export class ModbusConnector {
  private socket: Socket;
  private client: ModbusTCPClient;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(private host: string, private port: number = 502, private unitId: number = 1) {
    this.socket = new Socket();
    this.client = new ModbusTCPClient(this.socket, this.unitId);
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket.connect({ host: this.host, port: this.port }, () => {
        console.log(`[Modbus] Connected to ${this.host}:${this.port} (Unit ID: ${this.unitId})`);
        resolve();
      });

      this.socket.on('error', (err) => {
        console.error(`[Modbus] Connection error to ${this.host}:${this.port}`, err);
        reject(err);
      });
    });
  }

  startPolling(tags: ModbusTag[], intervalMs: number, callback: (name: string, value: any) => void): void {
    if (this.intervalId) clearInterval(this.intervalId);

    this.intervalId = setInterval(async () => {
      for (const tag of tags) {
        try {
          let value: any;
          switch (tag.type) {
            case 'holding':
              const hResp = await this.client.readHoldingRegisters(tag.address, tag.length);
              value = hResp.response._body.valuesAsArray;
              break;
            case 'input':
              const iResp = await this.client.readInputRegisters(tag.address, tag.length);
              value = iResp.response._body.valuesAsArray;
              break;
            case 'coil':
              const cResp = await this.client.readCoils(tag.address, tag.length);
              value = cResp.response._body.valuesAsArray;
              break;
            case 'discrete':
              const dResp = await this.client.readDiscreteInputs(tag.address, tag.length);
              value = dResp.response._body.valuesAsArray;
              break;
          }
          callback(tag.name, value);
        } catch (err) {
          console.error(`[Modbus] Error reading tag ${tag.name} at address ${tag.address}:`, err);
        }
      }
    }, intervalMs);
    
    console.log(`[Modbus] Started polling ${tags.length} tags every ${intervalMs}ms`);
  }

  disconnect(): void {
    if (this.intervalId) clearInterval(this.intervalId);
    this.socket.destroy();
    console.log(`[Modbus] Disconnected from ${this.host}:${this.port}`);
  }
}
