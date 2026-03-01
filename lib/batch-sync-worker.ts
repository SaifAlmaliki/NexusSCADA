import { prisma } from '@/lib/prisma';
import { getAdapter } from './batch-adapters';

export async function syncAllBatches() {
  try {
    const configs = await prisma.batchIntegrationConfig.findMany();
    
    for (const config of configs) {
      if (!config.baseUrl || !config.authToken) continue;
      
      const adapter = getAdapter(config.type);
      
      const allMappings = await prisma.batchExternalMapping.findMany({
        include: { batch: true }
      });

      for (const mapping of allMappings) {
        // Skip completed batches
        if (mapping.batch.state === 'COMPLETE' || mapping.batch.state === 'ABORT') continue;

        try {
          const status = await adapter.getStatus({
            baseUrl: config.baseUrl,
            authToken: config.authToken,
            mappingRules: config.mappingRules
          }, mapping.externalBatchId);
          
          await prisma.batch.update({
            where: { id: mapping.mesBatchId },
            data: { 
              state: status.state as any
            }
          });

          await prisma.batchExternalMapping.update({
            where: { id: mapping.id },
            data: {
              externalState: status.state,
              lastSyncAt: new Date(),
              syncError: null
            }
          });
        } catch (error: any) {
          await prisma.batchExternalMapping.update({
            where: { id: mapping.id },
            data: {
              syncError: error.message,
              lastSyncAt: new Date()
            }
          });
        }
      }
      
      await prisma.batchIntegrationConfig.update({
        where: { id: config.id },
        data: {
          lastSyncAt: new Date(),
          syncStatus: 'healthy'
        }
      });
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Sync error:', error);
    return { success: false, error: error.message };
  }
}
