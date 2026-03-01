import {
  OPCUAClient,
  ClientSession,
  ClientSubscription,
  AttributeIds,
  TimestampsToReturn,
  DataValue
} from 'node-opcua';

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

  async disconnect(): Promise<void> {
    if (this.subscription) await this.subscription.terminate();
    if (this.session) await this.session.close();
    await this.client.disconnect();
    console.log(`[OPC UA] Disconnected from ${this.endpoint}`);
  }
}
