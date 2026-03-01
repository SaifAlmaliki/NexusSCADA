"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModbusConnector = void 0;
const jsmodbus_1 = require("jsmodbus");
const net_1 = require("net");
class ModbusConnector {
    host;
    port;
    unitId;
    socket;
    client;
    intervalId = null;
    constructor(host, port = 502, unitId = 1) {
        this.host = host;
        this.port = port;
        this.unitId = unitId;
        this.socket = new net_1.Socket();
        this.client = new jsmodbus_1.ModbusTCPClient(this.socket, this.unitId);
    }
    async connect() {
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
    startPolling(tags, intervalMs, callback) {
        if (this.intervalId)
            clearInterval(this.intervalId);
        this.intervalId = setInterval(async () => {
            for (const tag of tags) {
                try {
                    let value;
                    switch (tag.type) {
                        case 'holding':
                            const hResp = await this.client.readHoldingRegisters(tag.address, tag.length);
                            value = hResp.response.body.valuesAsArray;
                            break;
                        case 'input':
                            const iResp = await this.client.readInputRegisters(tag.address, tag.length);
                            value = iResp.response.body.valuesAsArray;
                            break;
                        case 'coil':
                            const cResp = await this.client.readCoils(tag.address, tag.length);
                            value = cResp.response.body.valuesAsArray;
                            break;
                        case 'discrete':
                            const dResp = await this.client.readDiscreteInputs(tag.address, tag.length);
                            value = dResp.response.body.valuesAsArray;
                            break;
                    }
                    callback(tag.name, value);
                }
                catch (err) {
                    console.error(`[Modbus] Error reading tag ${tag.name} at address ${tag.address}:`, err);
                }
            }
        }, intervalMs);
        console.log(`[Modbus] Started polling ${tags.length} tags every ${intervalMs}ms`);
    }
    async writeRegister(address, value) {
        await this.client.writeSingleRegister(address, value);
        console.log(`[Modbus] Wrote ${value} to holding register ${address}`);
    }
    async writeCoil(address, value) {
        await this.client.writeSingleCoil(address, value);
        console.log(`[Modbus] Wrote ${value} to coil ${address}`);
    }
    disconnect() {
        if (this.intervalId)
            clearInterval(this.intervalId);
        this.socket.destroy();
        console.log(`[Modbus] Disconnected from ${this.host}:${this.port}`);
    }
    /**
     * Scan holding and input registers to detect non-zero values.
     * Returns array of { address, type, values } for potential tags.
     */
    async scan(startAddress = 0, count = 100) {
        const results = [];
        try {
            const holdingResp = await this.client.readHoldingRegisters(startAddress, count);
            const holdingValues = holdingResp.response.body.valuesAsArray;
            const holdingChunks = this.findNonZeroRanges(holdingValues, startAddress);
            for (const { start: addr, values } of holdingChunks) {
                results.push({ address: addr, type: 'holding', values });
            }
        }
        catch (err) {
            console.warn('[Modbus] Scan holding registers failed:', err);
        }
        try {
            const inputResp = await this.client.readInputRegisters(startAddress, count);
            const inputValues = inputResp.response.body.valuesAsArray;
            const inputChunks = this.findNonZeroRanges(inputValues, startAddress);
            for (const { start: addr, values } of inputChunks) {
                results.push({ address: addr, type: 'input', values });
            }
        }
        catch (err) {
            console.warn('[Modbus] Scan input registers failed:', err);
        }
        return results;
    }
    findNonZeroRanges(values, baseAddress) {
        const chunks = [];
        let chunkStart = -1;
        let chunkValues = [];
        for (let i = 0; i < values.length; i++) {
            const v = values[i];
            if (v !== 0 && v !== undefined) {
                if (chunkStart < 0) {
                    chunkStart = baseAddress + i;
                    chunkValues = [v];
                }
                else {
                    chunkValues.push(v);
                }
            }
            else {
                if (chunkStart >= 0) {
                    chunks.push({ start: chunkStart, values: chunkValues });
                    chunkStart = -1;
                }
            }
        }
        if (chunkStart >= 0) {
            chunks.push({ start: chunkStart, values: chunkValues });
        }
        return chunks;
    }
}
exports.ModbusConnector = ModbusConnector;
