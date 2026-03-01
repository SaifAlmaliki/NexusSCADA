import { NextResponse } from 'next/server';
import {
  OPCUAClient,
  AttributeIds,
  NodeClassMask,
} from 'node-opcua';

export interface BrowseResult {
  nodeId: string;
  browseName: string;
  nodeClass: string;
  dataType?: string;
  children?: BrowseResult[];
}

export async function POST(req: Request) {
  try {
    const { endpoint, nodeId, maxDepth = 3 } = await req.json();

    if (!endpoint || typeof endpoint !== 'string') {
      return NextResponse.json(
        { error: 'endpoint is required (e.g. opc.tcp://host:4840)' },
        { status: 400 }
      );
    }

    const client = OPCUAClient.create({
      endpointMustExist: false,
      connectionStrategy: {
        maxRetry: 2,
        initialDelay: 1000,
        maxDelay: 3000,
      },
    });

    await client.connect(endpoint);
    const session = await client.createSession();

    const nodeToBrowse = nodeId || 'i=84';
    const depth = Math.min(Math.max(Number(maxDepth) || 3, 1), 5);

    const doBrowse = async (nid: string, currentDepth: number): Promise<BrowseResult[]> => {
      if (currentDepth > depth) return [];

      const browseResult = await session.browse({
        nodeId: nid,
        referenceTypeId: null,
        browseDirection: 1,
        nodeClassMask: NodeClassMask.Variable | NodeClassMask.Object | NodeClassMask.VariableType,
        resultMask: 0x3f,
      });

      if (!browseResult.references?.length) return [];

      const results: BrowseResult[] = [];
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

      for (const ref of browseResult.references) {
        const refNodeId = ref.nodeId.toString();
        const child: BrowseResult = {
          nodeId: refNodeId,
          browseName: ref.browseName?.name || refNodeId,
          nodeClass: nodeClassNames[ref.nodeClass ?? 0] || 'Unknown',
        };

        if (ref.nodeClass === 2) {
          try {
            const dataValue = await session.read({
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

        if (currentDepth < depth && (ref.nodeClass === 1 || ref.nodeClass === 2)) {
          child.children = await doBrowse(refNodeId, currentDepth + 1);
        }

        results.push(child);
      }

      return results;
    };

    const tree = await doBrowse(nodeToBrowse, 0);

    await session.close();
    await client.disconnect();

    return NextResponse.json({ nodes: tree });
  } catch (error) {
    console.error('OPC UA discovery error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Discovery failed' },
      { status: 500 }
    );
  }
}
