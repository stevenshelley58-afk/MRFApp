import { MasterDataRow, MaterialRequest, WOMaterialRow, RequestStatus, WOConfig } from '../types';

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
}

// Export singleton instance
export const woMaterialsService = new WOMaterialsService();
