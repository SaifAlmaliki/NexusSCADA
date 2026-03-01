"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.S7Connector = void 0;
const nodes7_1 = __importDefault(require("nodes7"));
class S7Connector {
    host;
    rack;
    slot;
    conn = new nodes7_1.default();
    intervalId = null;
    constructor(host, rack = 0, slot = 1) {
        this.host = host;
        this.rack = rack;
        this.slot = slot;
    }
    async connect() {
        return new Promise((resolve, reject) => {
            this.conn.initiateConnection({ port: 102, host: this.host, rack: this.rack, slot: this.slot }, (err) => {
                if (err) {
                    console.error(`[S7] Connection failed to ${this.host}`, err);
                    return reject(err);
                }
                console.log(`[S7] Connected to ${this.host} (Rack: ${this.rack}, Slot: ${this.slot})`);
                resolve();
            });
        });
    }
    startPolling(tags, intervalMs, callback) {
        if (this.intervalId)
            clearInterval(this.intervalId);
        // Register tags with the nodeS7 library
        this.conn.setTranslationCB((tag) => tags[tag]);
        this.conn.addItems(Object.keys(tags));
        this.intervalId = setInterval(() => {
            this.conn.readAllItems((err, values) => {
                if (err) {
                    console.error(`[S7] Error reading tags from ${this.host}:`, err);
                    return;
                }
                for (const [key, value] of Object.entries(values)) {
                    callback(key, value);
                }
            });
        }, intervalMs);
        console.log(`[S7] Started polling ${Object.keys(tags).length} tags every ${intervalMs}ms`);
    }
    async write(tagName, value) {
        return new Promise((resolve, reject) => {
            this.conn.writeItems(tagName, value, (err) => {
                if (err)
                    return reject(err);
                console.log(`[S7] Wrote ${value} to ${tagName}`);
                resolve();
            });
        });
    }
    disconnect() {
        if (this.intervalId)
            clearInterval(this.intervalId);
        this.conn.dropConnection(() => {
            console.log(`[S7] Disconnected from ${this.host}`);
        });
    }
}
exports.S7Connector = S7Connector;
