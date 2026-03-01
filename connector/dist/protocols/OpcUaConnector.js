"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpcUaConnector = void 0;
const node_opcua_1 = require("node-opcua");
class OpcUaConnector {
    endpoint;
    client;
    session = null;
    subscription = null;
    constructor(endpoint) {
        this.endpoint = endpoint;
        this.client = node_opcua_1.OPCUAClient.create({
            endpointMustExist: false,
            connectionStrategy: {
                maxRetry: 10,
                initialDelay: 2000,
                maxDelay: 10000
            }
        });
    }
    async connect() {
        try {
            await this.client.connect(this.endpoint);
            this.session = await this.client.createSession();
            console.log(`[OPC UA] Connected to ${this.endpoint}`);
        }
        catch (error) {
            console.error(`[OPC UA] Failed to connect to ${this.endpoint}:`, error);
            throw error;
        }
    }
    async monitorTags(tags, callback) {
        if (!this.session)
            throw new Error("No active OPC UA session");
        this.subscription = await this.session.createSubscription2({
            requestedPublishingInterval: 1000,
            requestedLifetimeCount: 100,
            requestedMaxKeepAliveCount: 10,
            maxNotificationsPerPublish: 100,
            publishingEnabled: true,
            priority: 10
        });
        for (const tag of tags) {
            const itemToMonitor = {
                nodeId: tag,
                attributeId: node_opcua_1.AttributeIds.Value
            };
            const parameters = {
                samplingInterval: 1000,
                discardOldest: true,
                queueSize: 10
            };
            const monitoredItem = await this.subscription.monitor(itemToMonitor, parameters, node_opcua_1.TimestampsToReturn.Both);
            monitoredItem.on("changed", (dataValue) => {
                callback(tag, dataValue.value.value);
            });
        }
        console.log(`[OPC UA] Monitoring ${tags.length} tags`);
    }
    async write(nodeId, value) {
        if (!this.session)
            throw new Error('No active OPC UA session');
        const { DataValue, Variant, DataType } = await Promise.resolve().then(() => __importStar(require('node-opcua')));
        let variant;
        if (typeof value === 'boolean') {
            variant = new Variant({ dataType: DataType.Boolean, value });
        }
        else if (typeof value === 'number' && Number.isInteger(value)) {
            variant = new Variant({ dataType: DataType.Int32, value });
        }
        else {
            variant = new Variant({ dataType: DataType.Double, value: Number(value) });
        }
        await this.session.write({
            nodeId,
            attributeId: node_opcua_1.AttributeIds.Value,
            value: new DataValue({ value: variant }),
        });
        console.log(`[OPC UA] Wrote ${value} to ${nodeId}`);
    }
    async disconnect() {
        if (this.subscription)
            await this.subscription.terminate();
        if (this.session)
            await this.session.close();
        await this.client.disconnect();
        console.log(`[OPC UA] Disconnected from ${this.endpoint}`);
    }
    /**
     * Browse the OPC UA address space. Connects if not connected.
     */
    async browse(nodeId, maxDepth = 3) {
        if (!this.session) {
            await this.connect();
        }
        if (!this.session)
            throw new Error('No OPC UA session');
        const nodeToBrowse = nodeId || 'i=84'; // ObjectsFolder
        const doBrowse = async (nid, depth) => {
            if (depth > maxDepth)
                return [];
            const browseResult = await this.session.browse({
                nodeId: nid,
                referenceTypeId: null,
                browseDirection: 1, // Forward
                nodeClassMask: node_opcua_1.NodeClassMask.Variable | node_opcua_1.NodeClassMask.Object | node_opcua_1.NodeClassMask.VariableType,
                resultMask: 0x3f,
            });
            if (!browseResult.references || browseResult.references.length === 0)
                return [];
            const results = [];
            for (const ref of browseResult.references) {
                const refNodeId = ref.nodeId.toString();
                const nodeClassNames = {
                    1: 'Object',
                    2: 'Variable',
                    3: 'Method',
                    4: 'ObjectType',
                    5: 'VariableType',
                    6: 'ReferenceType',
                    7: 'DataType',
                    8: 'View',
                };
                const child = {
                    nodeId: refNodeId,
                    browseName: ref.browseName.name || refNodeId,
                    nodeClass: nodeClassNames[ref.nodeClass ?? 0] || 'Unknown',
                };
                if (ref.nodeClass === 2) {
                    try {
                        const dataValue = await this.session.read({
                            nodeId: ref.nodeId,
                            attributeId: node_opcua_1.AttributeIds.DataType,
                        });
                        if (dataValue.value?.value) {
                            child.dataType = String(dataValue.value.value);
                        }
                    }
                    catch {
                        // ignore
                    }
                }
                if (depth < maxDepth && (ref.nodeClass === 1 || ref.nodeClass === 2)) {
                    child.children = await doBrowse(refNodeId, depth + 1);
                }
                results.push(child);
            }
            return results;
        };
        return doBrowse(nodeToBrowse, 0);
    }
}
exports.OpcUaConnector = OpcUaConnector;
