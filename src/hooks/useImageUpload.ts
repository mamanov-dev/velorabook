'use client';

import { useState, useCallback, useMemo } from 'react';

export interface ProcessedImage {
  id: string;
  file: File;
  preview: string;
  base64: string;
  compressed: boolean;
  originalSize: number;
  compressedSize: number;
  dimensions: { width: number; height: number };
}

export interface ImageUploadState {
  images: ProcessedImage[];
  hasImages: boolean;
  totalSize: number;
  count: number;
  isValid: boolean;
}

export interface UseImageUploadReturn {
  imageState: ImageUploadState;
  handleImagesChange: (images: ProcessedImage[]) => void;
  clearImages: () => void;
  getImagesForApi: () => Array<{
    name: string;
    base64: string;
    size: number;
    dimensions: { width: number; height: number };
    compressed?: boolean;
  }>;
  getImageValidationError: () => string | null;
}

interface UseImageUploadOptions {
  required?: boolean;
  minImages?: number;
  maxImages?: number;
  maxTotalSize?: number; // в байтах
}

export function useImageUpload({
  required = false,
  minImages = 0,
  maxImages = 10,
  maxTotalSize = 20 * 1024 * 1024 // 20MB по умолчанию
}: UseImageUploadOptions = {}): UseImageUploadReturn {
  
  const [images, setImages] = useState<ProcessedImage[]>([]);

  // ✅ ИСПРАВЛЕНО: Убрана циклическая зависимость с помощью useMemo
  const imageState: ImageUploadState = useMemo(() => {
    const totalSize = images.reduce((sum, img) => sum + img.compressedSize, 0);
    const hasImages = images.length > 0;
    const count = images.length;
    
    // Вычисляем валидность
    const isValid = (() => {
      if (required && images.length === 0) return false;
      if (images.length < minImages) return false;
      if (images.length > maxImages) return false;
      if (totalSize > maxTotalSize) return false;
      return true;
    })();

    return {
      images,
      hasImages,
      totalSize,
      count,
      isValid
    };
  }, [images, required, minImages, maxImages, maxTotalSize]);

  // Обработчик изменения изображений
  const handleImagesChange = useCallback((newImages: ProcessedImage[]) => {
    console.log('📷 Обновление изображений:', {
      oldCount: images.length,
      newCount: newImages.length,
      newImages: newImages.map(img => ({
        id: img.id,
        name: img.file.name,
        size: img.compressedSize
      }))
    });
    setImages(newImages);
  }, [images.length]);

  // Очистка изображений
  const clearImages = useCallback(() => {
    console.log('🗑️ Очистка изображений:', images.length);
    
    // Освобождаем память от URL объектов
    images.forEach(img => {
      URL.revokeObjectURL(img.preview);
    });
    setImages([]);
  }, [images]);

  // Подготовка изображений для отправки в API
  const getImagesForApi = useCallback(() => {
    const apiImages = images.map(img => ({
      name: img.file.name,
      base64: img.base64,
      size: img.compressedSize,
      dimensions: img.dimensions,
      compressed: img.compressed
    }));
    
    console.log('🚀 Подготовка изображений для API:', {
      count: apiImages.length,
      totalSize: apiImages.reduce((sum, img) => sum + img.size, 0)
    });
    
    return apiImages;
  }, [images]);

  // Получение ошибки валидации
  const getImageValidationError = useCallback((): string | null => {
    if (required && images.length === 0) {
      return 'Необходимо загрузить хотя бы одно изображение';
    }
    
    if (images.length < minImages) {
      return `Минимум ${minImages} изображений`;
    }
    
    if (images.length > maxImages) {
      return `Максимум ${maxImages} изображений`;
    }
    
    const totalSize = images.reduce((sum, img) => sum + img.compressedSize, 0);
    if (totalSize > maxTotalSize) {
      const maxSizeMB = Math.round(maxTotalSize / (1024 * 1024));
      const currentSizeMB = Math.round(totalSize / (1024 * 1024));
      return `Общий размер изображений (${currentSizeMB}MB) превышает лимит ${maxSizeMB}MB`;
    }
    
    return null;
  }, [images, required, minImages, maxImages, maxTotalSize]);

  return {
    imageState,
    handleImagesChange,
    clearImages,
    getImagesForApi,
    getImageValidationError
  };
}