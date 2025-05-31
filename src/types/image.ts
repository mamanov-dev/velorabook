// src/types/image.ts

export interface ProcessedImage {
  id: string;
  file: File;
  preview: string;
  base64: string;
  compressed: boolean;
  originalSize: number;
  compressedSize: number;
  dimensions: {
    width: number;
    height: number;
  };
  isSecure: boolean; // Для совместимости с ImageUploader
}

export interface ImageUploadState {
  images: ProcessedImage[];
  hasImages: boolean;
  totalSize: number;
  count: number;
  isValid: boolean;
}
