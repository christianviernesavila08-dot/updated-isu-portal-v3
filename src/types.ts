/**
 * SPX-License-Identifier: Apache-2.0
 */

export interface EvaluationRecord {
  id?: string;
  batchId: string;       // Unique identifier for the submission session
  batchName: string;     // User-friendly name like "Day 1 Evaluations"
  supplierName: string;
  purchaseOrderNo: string;
  address: string;
  dateOfEvaluation: string;
  ratings: {
    quality: number;      // I. Quality of Items
    price: number;        // II. Fairness of Price
    delivery: number;     // III. Delivery Timeliness
    completeness: number; // IV. Completeness
    afterSales: number;   // V. After-Sales Service
  };
  comments: string;
  signature?: string;      // Base64 string
  designation: string;
  department: string;
  createdAt?: any;         // Firestore Timestamp
  averageScore: number;
  ratingCategory: string;
}

export const getRatingLabel = (score: number): string => {
  if (score >= 4.5) return 'Excellent';
  if (score >= 3.5) return 'Very Satisfactory';
  if (score >= 2.5) return 'Satisfactory';
  if (score >= 1.5) return 'Fair';
  return 'Poor';
};

export const getCategoryFromScore = (score: number): "Excellent" | "Very Satisfactory" | "Satisfactory" | "Fair" | "Poor" => {
  if (score >= 4.5) return "Excellent";
  if (score >= 3.5) return "Very Satisfactory";
  if (score >= 2.5) return "Satisfactory";
  if (score >= 1.5) return "Fair";
  return "Poor";
};

export const calculateAverage = (ratings: EvaluationRecord['ratings']): number => {
  const values = Object.values(ratings);
  const sum = values.reduce((acc, curr) => acc + curr, 0);
  return Number((sum / values.length).toFixed(2));
};
