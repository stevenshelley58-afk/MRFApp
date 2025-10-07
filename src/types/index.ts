// Type definitions will be implemented here
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Master Data Types (from mdtest.csv)
export interface MasterDataRow {
  workOrder: string;
  partNumber: string;
  description: string;
  packedQty: number;
  unit: string;
  stOpPackNumber: string | null;
  location: string;
  priority: string;
  category: string;
  lastUpdated: string;
}

// Transactional Data Types (from app's database)
export interface MaterialRequest {
  id: string;
  workOrder: string;
  partNumber: string;
  status: RequestStatus;
  requestedAt: string;
  requestedBy: string;
  packNumber: string | null;
}

// Combined View Types (Two-Layer Data Model)
export interface WOMaterialRow extends MasterDataRow {
  mrfStatus: string;
  mrfId?: string;
  isSelected: boolean;
}

// Status Types
export type RequestStatus = 'Submitted' | 'Requested' | 'Picking' | 'In Transit' | 'Delivered';
export type Priority = 'High' | 'Medium' | 'Low';

// Configuration Types
export interface SummaryCard {
  id: string;
  title: string;
  value: string;
  color: string;
  icon: string;
}

export interface TableConfig {
  defaultVisible: string[];
  reorderable: boolean;
  hideable: boolean;
}

export interface WOConfig {
  summaryCards: SummaryCard[];
  tableColumns: TableConfig;
}

// Dynamic Request Form
export type FormFieldType = 'text' | 'textarea' | 'select';

export interface FormFieldDefinition {
  name: string;
  label: string;
  type: FormFieldType;
  required: boolean;
  default?: string;
  options_key?: string; // for selects
}

export interface SelectOption {
  value: string;
  label: string;
}

export type RequestFormConfig = FormFieldDefinition[];

