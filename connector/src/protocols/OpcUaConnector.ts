import {
  OPCUAClient,
  ClientSession,
  ClientSubscription,
  AttributeIds,
  TimestampsToReturn,
  DataValue,
  NodeClassMask,
} from 'node-opcua';

export interface BrowseResult {
  nodeId: string;
  browseName: string;
  nodeClass: string;
  dataType?: string;
  children?: BrowseResult[];
}

export class OpcUaConnector {
  private client: OPCUAClient;
  private session: ClientSession | null = null;
  private subscription: ClientSubscription | null = null;

  constructor(private endpoint: string) {
    this.client = OPCUAClient.create({
      endpointMustExist: false,
      connectionStrategy: {
        maxRetry: 10,
        initialDelay: 2000,
        maxDelay: 10000
      }
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect(this.endpoint);
      this.session = await this.client.createSession();
      console.log(`[OPC UA] Connected to ${this.endpoint}`);
    } catch (error) {
      console.error(`[OPC UA] Failed to connect to ${this.endpoint}:`, error);
      throw error;
    }
  }

  async monitorTags(tags: string[], callback: (tag: string, value: any) => void): Promise<void> {
    if (!this.session) throw new Error("No active OPC UA session");

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
        attributeId: AttributeIds.Value
      };
      
      const parameters = {
        samplingInterval: 1000,
        discardOldest: true,
        queueSize: 10
      };

      const monitoredItem = await this.subscription.monitor(
        itemToMonitor,
        parameters,
        TimestampsToReturn.Both
      );
      
      monitoredItem.on("changed", (dataValue: DataValue) => {
        callback(tag, dataValue.value.value);
      });
    }
    
    console.log(`[OPC UA] Monitoring ${tags.length} tags`);
  }

  async write(nodeId: string, value: unknown): Promise<void> {
    if (!this.session) throw new Error('No active OPC UA session');
    const { DataValue, Variant, DataType } = await import('node-opcua');
    let variant: InstanceType<typeof Variant>;
    if (typeof value === 'boolean') {
      variant = new Variant({ dataType: DataType.Boolean, value });
    } else if (typeof value === 'number' && Number.isInteger(value)) {
      variant = new Variant({ dataType: DataType.Int32, value });
    } else {
      variant = new Variant({ dataType: DataType.Double, value: Number(value) });
    }
    await this.session.write({
      nodeId,
      attributeId: AttributeIds.Value,
      value: new DataValue({ value: variant }),
    });
    console.log(`[OPC UA] Wrote ${value} to ${nodeId}`);
  }

  async disconnect(): Promise<void> {
    if (this.subscription) await this.subscription.terminate();
    if (this.session) await this.session.close();
    await this.client.disconnect();
    console.log(`[OPC UA] Disconnected from ${this.endpoint}`);
  }

  /**
   * Browse the OPC UA address space. Connects if not connected.
   */
  async browse(nodeId?: string, maxDepth = 3): Promise<BrowseResult[]> {
    if (!this.session) {
      await this.connect();
    }
    if (!this.session) throw new Error('No OPC UA session');

    const nodeToBrowse = nodeId || 'i=84'; // ObjectsFolder

    const doBrowse = async (nid: string, depth: number): Promise<BrowseResult[]> => {
      if (depth > maxDepth) return [];

      const browseResult = await this.session!.browse({
        nodeId: nid,
        referenceTypeId: null,
        browseDirection: 1, // Forward
        nodeClassMask: NodeClassMask.Variable | NodeClassMask.Object | NodeClassMask.VariableType,
        resultMask: 0x3f,
      });

      if (!browseResult.references || browseResult.references.length === 0) return [];

      const results: BrowseResult[] = [];
      for (const ref of browseResult.references) {
        const refNodeId = ref.nodeId.toString();
        const nodeClassNames: Record<number, string> = {
          1: 'Object',
          2: 'Variable',
          3: 'Method',
          4: 'ObjectType',
          5: 'VariableType',
          6: 'ReferenceType',
          7: 'DataType',
          8: 'View',
        };
        const child: BrowseResult = {
          nodeId: refNodeId,
          browseName: ref.browseName.name || refNodeId,
          nodeClass: nodeClassNames[ref.nodeClass ?? 0] || 'Unknown',
        };

        if (ref.nodeClass === 2) {
          try {
            const dataValue = await this.session!.read({
              nodeId: ref.nodeId,
              attributeId: AttributeIds.DataType,
            });
            if (dataValue.value?.value) {
              child.dataType = String(dataValue.value.value);
            }
          } catch {
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
