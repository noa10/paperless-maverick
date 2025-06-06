export type ReceiptStatus = "unreviewed" | "reviewed";

// New processing status type for real-time updates
export type ProcessingStatus =
  | 'uploading'
  | 'uploaded'
  | 'processing_ocr'
  | 'processing_ai'
  | 'failed_ocr'
  | 'failed_ai'
  | 'complete'
  | null;

// Interface for managing the state during file upload and processing
export interface ReceiptUpload {
  id: string; // Unique ID for tracking the upload instance
  file: File; // The actual file object
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  uploadProgress: number; // Percentage 0-100
  processingStage?: 'queueing' | 'ocr' | 'ai_enhancement' | 'categorization' | string;
  error?: {
    code: 'FILE_TYPE' | 'SIZE_LIMIT' | 'UPLOAD_FAILED' | 'PROCESSING_FAILED' | string;
    message: string;
  } | null;
}

export interface ReceiptItem {
  id: string;
  receipt_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Receipt {
  id: string;
  date: string;
  merchant: string;
  total: number;
  payment_method: string;
  image_url?: string;
  thumbnail_url?: string | null;
  status: ReceiptStatus;
  created_at: string;
  updated_at: string;
  tax?: number;
  currency: string;
  fullText?: string;
  ai_suggestions?: AISuggestions;
  predicted_category?: string;
  // New fields for real-time status updates
  processing_status?: ProcessingStatus;
  processing_error?: string | null;
  confidence_scores?: {
    merchant?: number;
    date?: number;
    total?: number;
    tax?: number;
    line_items?: number;
    payment_method?: number;
  };
  processing_time?: number; // Time taken for backend processing (e.g., in seconds)
  // New fields for AI model selection
  model_used?: string; // The AI model used for processing
  primary_method?: 'ocr-ai' | 'ai-vision'; // The primary processing method
  has_alternative_data?: boolean; // Whether alternative data is available
  discrepancies?: Array<{
    field: string;
    primaryValue: any;
    alternativeValue: any;
  }>; // Discrepancies between primary and alternative methods
}

export interface ReceiptLineItem {
  id: string;
  receipt_id: string;
  description: string;
  amount: number;
  created_at?: string;
  updated_at?: string;
  geometry?: LineItemGeometry;
}

export interface LineItem {
  id?: string;
  receipt_id?: string;
  description: string;
  amount: number;
  created_at?: string;
  updated_at?: string;
}

export interface ConfidenceScore {
  id: string;
  receipt_id: string;
  merchant: number;
  date: number;
  total: number;
  tax?: number;
  line_items?: number;
  payment_method?: number;
  created_at: string;
  updated_at: string;
}

// ReceiptWithDetails now inherits confidence_scores from Receipt
// Define geometry types for bounding boxes
export interface BoundingBox {
  Left: number;
  Top: number;
  Width: number;
  Height: number;
}

export interface Polygon {
  points: Array<{ X: number; Y: number }>;
}

export interface GeometryData {
  boundingBox?: BoundingBox;
  polygon?: Polygon;
}

export interface FieldGeometry {
  merchant?: GeometryData;
  date?: GeometryData;
  total?: GeometryData;
  tax?: GeometryData;
  payment_method?: GeometryData;
  [key: string]: GeometryData | undefined;
}

export interface LineItemGeometry {
  item?: GeometryData;
  price?: GeometryData;
  combined?: BoundingBox;
}

export interface DocumentStructure {
  blocks: Array<any>;
  page_dimensions: {
    width: number;
    height: number;
  };
}

export interface ReceiptWithDetails extends Receipt {
  lineItems?: ReceiptLineItem[];
  fullText?: string;
  ai_suggestions?: AISuggestions;
  predicted_category?: string;
  processing_status?: ProcessingStatus;
  processing_error?: string | null;
  processing_time?: number;
  model_used?: string;
  primary_method?: 'ocr-ai' | 'ai-vision';
  has_alternative_data?: boolean;
  discrepancies?: Array<{
    field: string;
    primaryValue: any;
    alternativeValue: any;
  }>;
  // New fields for bounding box visualization
  field_geometry?: FieldGeometry;
  document_structure?: DocumentStructure;
}

export interface OCRResult {
  merchant: string;
  date: string;
  total: number;
  tax?: number;
  payment_method?: string;
  line_items?: LineItem[];
  confidence: {
    merchant: number;
    date: number;
    total: number;
    tax?: number;
    line_items?: number;
    payment_method?: number;
  };
  fullText?: string;
  // New fields from AI enhancement
  currency?: string;
  ai_suggestions?: AISuggestions;
  predicted_category?: string;
  // New fields for model selection and comparison
  modelUsed?: string;
  primaryMethod?: 'ocr-ai' | 'ai-vision';
  alternativeResult?: any; // The result from the alternative method
  discrepancies?: Array<{
    field: string;
    primaryValue: any;
    alternativeValue: any;
  }>; // Discrepancies between primary and alternative methods
  processing_time?: number;
}

// Interface for processing logs
export interface ProcessingLog {
  id: string;
  receipt_id: string;
  created_at: string;
  status_message: string;
  step_name: string | null;
}

// Interface for AI suggestions
export interface AISuggestions {
  merchant?: string;
  date?: string;
  total?: number;
  tax?: number;
  [key: string]: any;
}

// Interface for corrections (feedback loop)
export interface Correction {
  id: number;
  receipt_id: string;
  field_name: string;
  original_value: string | null;
  ai_suggestion: string | null;
  corrected_value: string;
  created_at: string;
}
