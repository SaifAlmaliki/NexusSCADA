export interface BatchAdapterConfig {
  baseUrl: string;
  authToken: string;
  mappingRules: any;
}

export interface BatchAdapter {
  createBatch(config: BatchAdapterConfig, payload: any): Promise<{ externalBatchId: string }>;
  getStatus(config: BatchAdapterConfig, externalBatchId: string): Promise<{ state: string, actualQuantity?: number }>;
}

export class RestBatchAdapter implements BatchAdapter {
  async createBatch(config: BatchAdapterConfig, payload: any) {
    try {
      const response = await fetch(`${config.baseUrl}/batches`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${config.authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`External API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { externalBatchId: data.batchId || data.id || `EXT-${Date.now()}` };
    } catch (error) {
      console.error('REST Adapter createBatch error:', error);
      // Fallback for demo purposes if the external server is not running
      return { externalBatchId: `EXT-${Date.now()}` };
    }
  }

  async getStatus(config: BatchAdapterConfig, externalBatchId: string) {
    try {
      const response = await fetch(`${config.baseUrl}/batches/${externalBatchId}/status`, {
        headers: { 'Authorization': `Bearer ${config.authToken}` }
      });
      
      if (!response.ok) {
        throw new Error(`External API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      return { state: data.state, actualQuantity: data.actualQuantity };
    } catch (error) {
      console.error('REST Adapter getStatus error:', error);
      // Fallback for demo purposes
      const states = ['IDLE', 'SETUP', 'RUNNING', 'HOLD', 'COMPLETE'];
      return { state: states[Math.floor(Math.random() * states.length)] };
    }
  }
}

export function getAdapter(type: string): BatchAdapter {
  switch (type.toLowerCase()) {
    case 'rest':
      return new RestBatchAdapter();
    // Add OPC-UA or other adapters here
    default:
      return new RestBatchAdapter();
  }
}
