'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, RotateCcw, Move, Download, AlertCircle } from 'lucide-react';

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

interface ImageUploaderProps {
  maxFiles?: number;
  maxSizeBytes?: number;
  acceptedFormats?: string[];
  onImagesChange: (images: ProcessedImage[]) => void;
  initialImages?: ProcessedImage[];
  disabled?: boolean;
}

export default function ImageUploader({
  maxFiles = 10,
  maxSizeBytes = 5 * 1024 * 1024, // 5MB
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  onImagesChange,
  initialImages = [],
  disabled = false
}: ImageUploaderProps) {
  const [images, setImages] = useState<ProcessedImage[]>(initialImages);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Утилиты для работы с изображениями
  const compressImage = async (file: File, maxWidth = 1200, quality = 0.8): Promise<{ blob: Blob; base64: string }> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Не удалось создать canvas context'));
        return;
      }
      
      const img = new Image();
      
      img.onload = () => {
        // Вычисляем новые размеры с сохранением пропорций
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Рисуем сжатое изображение
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Конвертируем в blob и base64
        canvas.toBlob((blob) => {
          if (blob) {
            const base64 = canvas.toDataURL('image/jpeg', quality);
            resolve({ blob, base64 });
          } else {
            reject(new Error('Не удалось создать blob'));
          }
        }, 'image/jpeg', quality);
      };
      
      img.onerror = () => {
        reject(new Error('Не удалось загрузить изображение'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = () => {
        reject(new Error('Не удалось получить размеры изображения'));
        URL.revokeObjectURL(img.src);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // ✅ УЛУЧШЕНО: Расширенная обработка файлов с отладкой
  const processFiles = async (files: FileList | File[]) => {
    console.log('📁 Начинаем обработку файлов:', {
      filesCount: files.length,
      currentImagesCount: images.length,
      maxFiles,
      maxSizeBytes
    });

    setIsProcessing(true);
    setError(null);
    
    const fileArray = Array.from(files);
    const newProcessedImages: ProcessedImage[] = [];
    
    // Проверяем лимиты
    if (images.length + fileArray.length > maxFiles) {
      const errorMsg = `Максимум ${maxFiles} изображений. Сейчас: ${images.length}, пытаетесь добавить: ${fileArray.length}`;
      console.warn('⚠️ Превышен лимит файлов:', errorMsg);
      setError(errorMsg);
      setIsProcessing(false);
      return;
    }
    
    try {
      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];
        
        console.log(`📸 Обрабатываем файл ${i + 1}/${fileArray.length}:`, {
          name: file.name,
          type: file.type,
          size: file.size
        });
        
        // Валидация формата
        if (!acceptedFormats.includes(file.type)) {
          const errorMsg = `Формат ${file.type} не поддерживается. Поддерживаемые: ${acceptedFormats.join(', ')}`;
          console.warn('⚠️ Неподдерживаемый формат:', errorMsg);
          setError(errorMsg);
          continue;
        }
        
        // Валидация размера
        if (file.size > maxSizeBytes) {
          const errorMsg = `Файл ${file.name} слишком большой (${Math.round(file.size / (1024 * 1024))}MB). Максимум: ${Math.round(maxSizeBytes / (1024 * 1024))}MB`;
          console.warn('⚠️ Файл слишком большой:', errorMsg);
          setError(errorMsg);
          continue;
        }
        
        try {
          // Получаем размеры изображения
          const dimensions = await getImageDimensions(file);
          console.log('📐 Размеры изображения:', dimensions);
          
          // Определяем нужно ли сжимать
          const needsCompression = file.size > 1024 * 1024 || dimensions.width > 1200; // Сжимаем если больше 1MB или ширина > 1200px
          
          let finalBlob: Blob = file;
          let base64: string;
          let compressed = false;
          
          if (needsCompression) {
            console.log('🗜️ Сжимаем изображение...');
            const result = await compressImage(file);
            finalBlob = result.blob;
            base64 = result.base64;
            compressed = true;
            console.log('✅ Сжатие завершено:', {
              originalSize: file.size,
              compressedSize: finalBlob.size,
              reduction: Math.round((1 - finalBlob.size / file.size) * 100) + '%'
            });
          } else {
            console.log('📋 Создаем base64 без сжатия...');
            base64 = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = () => reject(new Error('Ошибка чтения файла'));
              reader.readAsDataURL(file);
            });
          }
          
          const processedImage: ProcessedImage = {
            id: `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            file: new File([finalBlob], file.name, { type: file.type }),
            preview: URL.createObjectURL(finalBlob),
            base64,
            compressed,
            originalSize: file.size,
            compressedSize: finalBlob.size,
            dimensions
          };
          
          newProcessedImages.push(processedImage);
          console.log('✅ Файл успешно обработан:', {
            id: processedImage.id,
            name: file.name,
            originalSize: file.size,
            finalSize: finalBlob.size
          });
          
        } catch (fileError) {
          console.error('❌ Ошибка обработки файла:', file.name, fileError);
          setError(`Ошибка обработки файла ${file.name}: ${fileError instanceof Error ? fileError.message : 'Неизвестная ошибка'}`);
        }
      }
      
      if (newProcessedImages.length > 0) {
        const updatedImages = [...images, ...newProcessedImages];
        console.log('🔄 Обновляем состояние изображений:', {
          oldCount: images.length,
          newCount: newProcessedImages.length,
          totalCount: updatedImages.length
        });
        
        setImages(updatedImages);
        onImagesChange(updatedImages);
        
        console.log('✅ Все файлы обработаны успешно');
      } else {
        console.warn('⚠️ Ни один файл не был обработан');
        if (!error) {
          setError('Ни один файл не был добавлен. Проверьте формат и размер файлов.');
        }
      }
      
    } catch (err) {
      const errorMsg = 'Ошибка при обработке изображений';
      console.error('❌ Общая ошибка обработки:', err);
      setError(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  // Удаление изображения
  const removeImage = (id: string) => {
    console.log('🗑️ Удаляем изображение:', id);
    
    const imageToRemove = images.find(img => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    
    const updatedImages = images.filter(img => img.id !== id);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  // Изменение порядка изображений
  const moveImage = (fromIndex: number, toIndex: number) => {
    console.log('↔️ Перемещаем изображение:', { fromIndex, toIndex });
    
    const updatedImages = [...images];
    const [movedImage] = updatedImages.splice(fromIndex, 1);
    updatedImages.splice(toIndex, 0, movedImage);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  // Drag & Drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      console.log('📂 Файлы перетащены:', e.dataTransfer.files.length);
      processFiles(e.dataTransfer.files);
    }
  }, [disabled]);

  // File input handler
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      console.log('📂 Файлы выбраны через диалог:', e.target.files.length);
      processFiles(e.target.files);
    }
  };

  // Форматирование размера файла
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
          dragActive
            ? 'border-purple-500 bg-purple-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFormats.join(',')}
          className="hidden"
          onChange={handleFileInput}
          disabled={disabled}
        />
        
        {isProcessing ? (
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mr-2"></div>
            <span className="text-gray-600">Обрабатываем изображения...</span>
          </div>
        ) : (
          <>
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 mb-2">
              Перетащите изображения сюда или нажмите для выбора
            </p>
            <p className="text-sm text-gray-500">
              До {maxFiles} файлов, максимум {formatFileSize(maxSizeBytes)} каждый
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Поддерживаемые форматы: JPEG, PNG, WebP
            </p>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div
              key={image.id}
              className="relative group bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              {/* Image Preview */}
              <div className="aspect-square relative">
                <img
                  src={image.preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
                
                {/* Controls */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(image.id);
                    }}
                    className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors"
                    title="Удалить"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                {/* Move Controls */}
                <div className="absolute bottom-2 left-2 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {index > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveImage(index, index - 1);
                      }}
                      className="bg-gray-800 text-white p-1 rounded hover:bg-gray-700 transition-colors"
                      title="Переместить влево"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                  {index < images.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        moveImage(index, index + 1);
                      }}
                      className="bg-gray-800 text-white p-1 rounded hover:bg-gray-700 transition-colors"
                      title="Переместить вправо"
                    >
                      <Move className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Compression Badge */}
                {image.compressed && (
                  <div className="absolute top-2 left-2">
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      Сжато
                    </span>
                  </div>
                )}
              </div>

              {/* Image Info */}
              <div className="p-2 text-xs text-gray-600">
                <div className="truncate mb-1" title={image.file.name}>
                  {image.file.name}
                </div>
                <div className="flex justify-between items-center">
                  <span>{image.dimensions.width}×{image.dimensions.height}</span>
                  <span>
                    {image.compressed 
                      ? `${formatFileSize(image.compressedSize)} (было ${formatFileSize(image.originalSize)})`
                      : formatFileSize(image.originalSize)
                    }
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {images.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center text-sm text-gray-600">
            <span>
              Загружено: {images.length} из {maxFiles} изображений
            </span>
            <span>
              Общий размер: {formatFileSize(images.reduce((sum, img) => sum + img.compressedSize, 0))}
            </span>
          </div>
          {images.some(img => img.compressed) && (
            <p className="text-xs text-green-600 mt-2">
              ✓ Некоторые изображения были автоматически сжаты для лучшей производительности
            </p>
          )}
        </div>
      )}
    </div>
  );
}