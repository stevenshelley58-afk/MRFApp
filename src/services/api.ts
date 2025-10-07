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
}

// Export singleton instance
export const woMaterialsService = new WOMaterialsService();
