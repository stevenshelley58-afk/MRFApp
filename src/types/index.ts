// Type definitions will be implemented here
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Placeholder types - will be expanded as needed
export type Status = 'pending' | 'approved' | 'rejected' | 'completed';
