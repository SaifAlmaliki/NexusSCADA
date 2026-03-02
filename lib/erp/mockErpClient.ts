type MockErpOrder = {
  erpOrderId: string;
  orderNumber: string;
  product: string;
  targetQty: number;
  plannedStartDate?: string;
  plannedEndDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
};

const MOCK_ERP_ORDERS: MockErpOrder[] = [
  {
    erpOrderId: 'ERP-2026-041',
    orderNumber: 'WO-2026-041',
    product: 'Industrial Lubricant XL',
    targetQty: 600,
    plannedStartDate: new Date().toISOString(),
    status: 'PENDING',
  },
  {
    erpOrderId: 'ERP-2026-042',
    orderNumber: 'WO-2026-042',
    product: 'Coolant Premium',
    targetQty: 200,
    plannedStartDate: new Date().toISOString(),
    status: 'PENDING',
  },
  {
    erpOrderId: 'ERP-2026-043',
    orderNumber: 'WO-2026-043',
    product: 'Hydraulic Fluid',
    targetQty: 320,
    plannedStartDate: new Date().toISOString(),
    status: 'PENDING',
  },
];

export async function fetchErpOrders(): Promise<MockErpOrder[]> {
  return MOCK_ERP_ORDERS;
}

export async function pushStatusesToErp() {
  // Stub for future real ERP integration.
  return { success: true };
}

