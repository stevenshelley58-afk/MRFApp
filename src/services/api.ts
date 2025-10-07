import { MasterDataRow, MaterialRequest, WOMaterialRow, RequestStatus, WOConfig, RequestFormConfig, SelectOption } from '../types';

// Mock data imports (in a real app, these would be API calls)
import masterDataCsv from '../data/mdtest.csv';
import transactionalData from '../data/transactional-data.json';
import woConfig from '../config/wo-materials-config.json';

// Parse CSV data (simplified for demo)
const parseMasterData = (csvContent: string): MasterDataRow[] => {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return {
      workOrder: values[0],
      partNumber: values[1],
      description: values[2],
      packedQty: parseInt(values[3]) || 0,
      unit: values[4],
      stOpPackNumber: values[5] || null,
      location: values[6],
      priority: values[7],
      category: values[8],
      lastUpdated: values[9]
    };
  });
};

// Two-Layer Data Model Service
export class WOMaterialsService {
  private masterData: MasterDataRow[];
  private transactionalData: MaterialRequest[];
  // mock OS settings and lists for dynamic forms
  private requestFormConfig: RequestFormConfig = [
    { name: 'DeliverTo', label: 'Deliver To', type: 'select', required: true, options_key: 'DeliveryLocations' },
    { name: 'RecipientName', label: 'Recipient Name', type: 'text', required: true, default: 'currentUser.name' },
    { name: 'ContactNumber', label: 'Contact Number', type: 'text', required: true, default: 'currentUser.phone' },
    { name: 'Priority', label: 'Priority', type: 'select', required: true, options_key: 'RequestPriorities' },
    { name: 'Comments', label: 'Comments / Special Instructions', type: 'textarea', required: false }
  ];

  private lists: Record<string, SelectOption[]> = {
    DeliveryLocations: [
      { value: 'yard-a', label: 'Yard A' },
      { value: 'warehouse-1', label: 'Warehouse 1' },
      { value: 'site-12', label: 'Site 12' },
    ],
    RequestPriorities: [
      { value: 'urgent', label: 'Urgent' },
      { value: 'high', label: 'High' },
      { value: 'normal', label: 'Normal' },
    ],
  };

  constructor() {
    this.masterData = parseMasterData(masterDataCsv);
    this.transactionalData = transactionalData as MaterialRequest[];
  }

  // Get the combined view (Two-Layer Data Model)
  getWOMaterials(): WOMaterialRow[] {
    return this.masterData.map(masterRow => {
      // Find matching transactional data
      const transaction = this.transactionalData.find(
        t => t.workOrder === masterRow.workOrder && 
             t.partNumber === masterRow.partNumber
      );

      let mrfStatus = 'Not Requested';
      let mrfId: string | undefined;

      if (transaction) {
        mrfStatus = `${transaction.status} (${transaction.id})`;
        mrfId = transaction.id;
      }

      return {
        ...masterRow,
        mrfStatus,
        mrfId,
        isSelected: false
      };
    });
  }

  // Get configuration
  getConfig(): WOConfig {
    return woConfig as WOConfig;
  }

  // Dynamic request form config and lists
  getRequestFormConfig(): RequestFormConfig {
    return this.requestFormConfig;
  }

  getListByKey(key: string): SelectOption[] {
    return this.lists[key] || [];
  }

  // Handle pack selection logic
  selectPack(packNumber: string, selectedRows: WOMaterialRow[]): WOMaterialRow[] {
    return selectedRows.map(row => ({
      ...row,
      isSelected: row.stOpPackNumber === packNumber ? true : row.isSelected
    }));
  }

  // Handle pack deselection logic
  deselectPack(packNumber: string, selectedRows: WOMaterialRow[]): WOMaterialRow[] {
    return selectedRows.map(row => ({
      ...row,
      isSelected: row.stOpPackNumber === packNumber ? false : row.isSelected
    }));
  }

  // Get material request details by ID
  getMaterialRequestById(mrfId: string): MaterialRequest | undefined {
    return this.transactionalData.find(t => t.id === mrfId);
  }

  // Submit a new material request (mock). Creates one MRF ID for all selected rows
  submitMaterialRequest(selected: WOMaterialRow[], _details: Record<string,string>): { mrfId: string } {
    const mrfId = this.generateMRFId();
    const now = new Date().toISOString();
    for (const row of selected) {
      const entry: MaterialRequest = {
        id: mrfId,
        workOrder: row.workOrder,
        partNumber: row.partNumber,
        status: 'Submitted' as RequestStatus,
        requestedAt: now,
        requestedBy: 'Jane Doe',
        packNumber: row.stOpPackNumber,
      };
      // If an entry already exists for this item, replace it
      const idx = this.transactionalData.findIndex(t => t.workOrder === entry.workOrder && t.partNumber === entry.partNumber);
      if (idx >= 0) this.transactionalData[idx] = entry; else this.transactionalData.push(entry);
    }
    return { mrfId };
  }

  private generateMRFId(): string {
    const num = Math.floor(1000 + Math.random() * 9000);
    return `MRF-${num}`;
  }

  // Fulfillment APIs (mock)
  // Return picklist (Submitted only), sorted by MC priority flag DESC then RequiredByTimestamp ASC
  getPickList(): Array<{
    id: string;
    status: string;
    mcPriorityFlag: boolean;
    priority: 'P1'|'P2'|'P3'|'P4';
    items: number;
    requiredBy: string; // ISO
    deliveryLocation: string;
    workOrders: string;
  }> {
    // Synthesize from transactionalData + mock
    const base = [
      { id:'MRF-1234', status:'Submitted', mcPriorityFlag:false, priority:'P2' as const, items:5, requiredBy:'2025-07-12T11:00:00Z', deliveryLocation:'Warehouse 1', workOrders:'822670' },
      { id:'MRF-1232', status:'Submitted', mcPriorityFlag:true, priority:'P1' as const, items:2, requiredBy:'2025-07-12T10:30:00Z', deliveryLocation:'Yard A', workOrders:'855798' },
      { id:'MRF-1198', status:'Submitted', mcPriorityFlag:false, priority:'P4' as const, items:1, requiredBy:'2025-07-12T12:00:00Z', deliveryLocation:'Warehouse 1', workOrders:'857330' },
    ];
    return base.sort((a,b)=> (Number(b.mcPriorityFlag) - Number(a.mcPriorityFlag)) || (new Date(a.requiredBy).getTime() - new Date(b.requiredBy).getTime()));
  }

  startPick(mrfId: string) {
    const req = this.transactionalData.find(t => t.id === mrfId);
    if (req) req.status = 'Picking' as RequestStatus;
    // no-op return
    return { ok: true };
  }

  // Picking page mock data and actions
  getRequestItems(mrfId: string): Array<{
    id: string; // line id
    status: 'Open'|'Picked'|'Exception';
    qty: number;
    description: string;
    itemNumber: string;
    location: string;
    packNumber?: string | null;
  }> {
    // Simple static lines for demo
    return [
      { id:`${mrfId}-L1`, status:'Open', qty:10, description:'10-inch Steel Pipe, 20ft', itemNumber:'PIPE-STEEL-10', location:'Yard A', packNumber:'PACK001' },
      { id:`${mrfId}-L2`, status:'Open', qty:2, description:'10-inch Gate Valve, Class 300', itemNumber:'VALVE-GATE-10', location:'WH1 Aisle 3', packNumber:'PACK001' },
      { id:`${mrfId}-L3`, status:'Open', qty:25, description:'10-inch Spiral Wound Gasket', itemNumber:'GASKET-SPIRAL-10', location:'WH1 Bin 7' },
      { id:`${mrfId}-L4`, status:'Open', qty:10, description:'Welding Rod E7018, 50lb box', itemNumber:'WELD-ROD-E7018', location:'WH1 Bin 1' },
    ];
  }

  markAllPicked(mrfId: string) { return { ok: true }; }
  markLinePicked(lineId: string) { return { ok: true }; }
  logPartialPick(lineId: string, qtyPicked: number) { return { ok: true }; }
  flagException(lineId: string, reason: string, comment?: string) { return { ok: true }; }
  stageComplete(mrfId: string) { return { ok: true }; }

  // AC Dashboard APIs
  getACDashboardData(scopeId: string): {
    exceptionsCount: number;
    overdueCount: number;
    deliveredTodayCount: number;
    actionQueue: Array<{
      id: string;
      status: RequestStatus;
      priority: 'P1'|'P2'|'P3'|'P4';
      requestor: string;
      issue: string;
      created: string;
    }>;
  } {
    // Mock data for AC dashboard
    return {
      exceptionsCount: 3,
      overdueCount: 2,
      deliveredTodayCount: 7,
      actionQueue: [
        { id:'MRF-1232', status:'Exception', priority:'P1', requestor:'John Smith', issue:'Open Exception', created:'07/12/2025' },
        { id:'MRF-1235', status:'Submitted', priority:'P2', requestor:'Jane Doe', issue:'Stuck in Queue', created:'06/12/2025' },
        { id:'MRF-1236', status:'Picking', priority:'P1', requestor:'Bob Wilson', issue:'High Priority', created:'07/12/2025' },
        { id:'MRF-1237', status:'Exception', priority:'P3', requestor:'Alice Brown', issue:'Open Exception', created:'07/12/2025' },
      ]
    };
  }

  addComment(mrfId: string, comment: string) { return { ok: true }; }

  // AC Scope Control APIs
  getACScopeData(scopeId: string): {
    exceptionsCount: number;
    queuePosition: {
      totalInQueue: number;
      highestPriority: { id: string; position: number };
      nextToPick: { id: string; position: number };
    };
    lockedMaterialsCount: number;
    priorityQueue: Array<{
      id: string;
      requestor: string;
      items: number;
      created: string;
      acPriorityScore: number;
    }>;
    allScopeRequests: Array<{
      id: string;
      status: RequestStatus;
      priority: 'P1'|'P2'|'P3'|'P4';
      requestor: string;
      items: number;
      created: string;
    }>;
  } {
    return {
      exceptionsCount: 3,
      queuePosition: {
        totalInQueue: 8,
        highestPriority: { id: 'MRF-1232', position: 2 },
        nextToPick: { id: 'MRF-1235', position: 7 }
      },
      lockedMaterialsCount: 5,
      priorityQueue: [
        { id: 'MRF-1232', requestor: 'John Smith', items: 3, created: '07/12/2025', acPriorityScore: 1 },
        { id: 'MRF-1235', requestor: 'Jane Doe', items: 2, created: '06/12/2025', acPriorityScore: 2 },
        { id: 'MRF-1236', requestor: 'Bob Wilson', items: 4, created: '07/12/2025', acPriorityScore: 3 },
      ],
      allScopeRequests: [
        { id: 'MRF-1232', status: 'Submitted', priority: 'P1', requestor: 'John Smith', items: 3, created: '07/12/2025' },
        { id: 'MRF-1235', status: 'Submitted', priority: 'P2', requestor: 'Jane Doe', items: 2, created: '06/12/2025' },
        { id: 'MRF-1236', status: 'Picking', priority: 'P1', requestor: 'Bob Wilson', items: 4, created: '07/12/2025' },
        { id: 'MRF-1237', status: 'Exception', priority: 'P3', requestor: 'Alice Brown', items: 1, created: '07/12/2025' },
        { id: 'MRF-1238', status: 'Delivered', priority: 'P4', requestor: 'Charlie Davis', items: 2, created: '05/12/2025' },
      ]
    };
  }

  updateACPriorityOrder(mrfIds: string[]) { return { ok: true }; }

  lockMaterial(pKey: string, comment: string) { return { ok: true }; }
  unlockMaterial(pKey: string) { return { ok: true }; }
  getLockedMaterials(): Array<{ pKey: string; lockedBy: string; comment: string; materialDescription: string }> {
    return [
      { pKey: '8226706300', lockedBy: 'Steve', comment: 'Reserved for critical path job on Friday', materialDescription: '10-inch Steel Pipe' },
      { pKey: '822670600', lockedBy: 'Sarah', comment: 'Emergency backup for Unit 3', materialDescription: 'Gate Valve' },
    ];
  }
}

// Export singleton instance
export const woMaterialsService = new WOMaterialsService();
