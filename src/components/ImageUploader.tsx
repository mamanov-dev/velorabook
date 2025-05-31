'use client';

import React, { useState, useRef, useCallback } from 'react';
import { X, RotateCcw, Move, AlertCircle, Shield } from 'lucide-react';
import Image from 'next/image';

export interface ProcessedImage {
  id: string;
  file: File;
  preview: string;
  base64: string;
  compressed: boolean;
  originalSize: number;
  compressedSize: number;
  dimensions: { width: number; height: number };
  isSecure: boolean; // Новое поле для отметки безопасности
}

interface ImageUploaderProps {
  maxFiles?: number;
  maxSizeBytes?: number;
  acceptedFormats?: string[];
  onImagesChange: (images: ProcessedImage[]) => void;
  initialImages?: ProcessedImage[];
  disabled?: boolean;
}

// Проверка magic bytes файлов
const validateImageFile = async (file: File): Promise<boolean> => {
  try {
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    
    // Проверяем magic bytes для различных форматов
    const magicBytes = {
      jpeg: [0xFF, 0xD8, 0xFF],
      png: [0x89, 0x50, 0x4E, 0x47],
      webp: [0x52, 0x49, 0x46, 0x46], // RIFF (WebP начинается с RIFF)
      gif: [0x47, 0x49, 0x46], // GIF
    };

    // Проверяем JPEG
    if (uint8Array[0] === magicBytes.jpeg[0] && 
        uint8Array[1] === magicBytes.jpeg[1] && 
        uint8Array[2] === magicBytes.jpeg[2]) {
      return true;
    }

    // Проверяем PNG
    if (uint8Array[0] === magicBytes.png[0] && 
        uint8Array[1] === magicBytes.png[1] && 
        uint8Array[2] === magicBytes.png[2] && 
        uint8Array[3] === magicBytes.png[3]) {
      return true;
    }

    // Проверяем WebP (сложнее - нужно проверить RIFF + WEBP)
    if (uint8Array[0] === magicBytes.webp[0] && 
        uint8Array[1] === magicBytes.webp[1] && 
        uint8Array[2] === magicBytes.webp[2] && 
        uint8Array[3] === magicBytes.webp[3] &&
        uint8Array[8] === 0x57 && // W
        uint8Array[9] === 0x45 && // E
        uint8Array[10] === 0x42 && // B
        uint8Array[11] === 0x50) { // P
      return true;
    }

    // Проверяем GIF
    if (uint8Array[0] === magicBytes.gif[0] && 
        uint8Array[1] === magicBytes.gif[1] && 
        uint8Array[2] === magicBytes.gif[2]) {
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error validating image file:', error);
    return false;
  }
};

// Проверка на подозрительное содержимое
const checkForSuspiciousContent = (file: File): boolean => {
  // Проверяем расширение файла
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.js'];
  const filename = file.name.toLowerCase();
  
  return !suspiciousExtensions.some(ext => filename.includes(ext));
};

// Продвинутая проверка размеров
const validateImageDimensions = (width: number, height: number): { valid: boolean; reason?: string } => {
  // Минимальные размеры (избегаем пиксельные изображения)
  if (width < 50 || height < 50) {
    return { valid: false, reason: 'Изображение слишком маленькое (минимум 50x50px)' };
  }

  // Максимальные размеры (избегаем огромные изображения)
  if (width > 8000 || height > 8000) {
    return { valid: false, reason: 'Изображение слишком большое (максимум 8000x8000px)' };
  }

  // Проверяем соотношение сторон (избегаем подозрительно узкие изображения)
  const aspectRatio = Math.max(width, height) / Math.min(width, height);
  if (aspectRatio > 10) {
    return { valid: false, reason: 'Неподходящее соотношение сторон' };
  }

  return { valid: true };
};

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
  const [securityWarnings, setSecurityWarnings] = useState<string[]>([]);
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
      
      const img = new window.Image();
      
      img.onload = () => {
        // Вычисляем новые размеры с сохранением пропорций
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Очищаем canvas белым фоном (безопасность)
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
      const img = new window.Image();
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

  // Расширенная обработка файлов с улучшенной безопасностью
  const processFiles = useCallback(async (files: FileList | File[]) => {
    console.log('📁 Начинаем безопасную обработку файлов:', {
      filesCount: files.length,
      currentImagesCount: images.length,
      maxFiles,
      maxSizeBytes
    });

    setIsProcessing(true);
    setError(null);
    setSecurityWarnings([]);
    
    const fileArray = Array.from(files);
    const newProcessedImages: ProcessedImage[] = [];
    const warnings: string[] = [];
    
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
        
        console.log(`📸 Безопасная обработка файла ${i + 1}/${fileArray.length}:`, {
          name: file.name,
          type: file.type,
          size: file.size
        });
        
        // 1. Проверка имени файла на подозрительное содержимое
        if (!checkForSuspiciousContent(file)) {
          warnings.push(`Файл ${file.name} имеет подозрительное расширение`);
          continue;
        }

        // 2. Валидация MIME типа
        if (!acceptedFormats.includes(file.type)) {
          const errorMsg = `Формат ${file.type} не поддерживается. Поддерживаемые: ${acceptedFormats.join(', ')}`;
          console.warn('⚠️ Неподдерживаемый формат:', errorMsg);
          setError(errorMsg);
          continue;
        }
        
        // 3. Валидация размера файла
        if (file.size > maxSizeBytes) {
          const errorMsg = `Файл ${file.name} слишком большой (${Math.round(file.size / (1024 * 1024))}MB). Максимум: ${Math.round(maxSizeBytes / (1024 * 1024))}MB`;
          console.warn('⚠️ Файл слишком большой:', errorMsg);
          setError(errorMsg);
          continue;
        }

        // 4. Проверка magic bytes (реальное содержимое файла)
        const isValidImage = await validateImageFile(file);
        if (!isValidImage) {
          warnings.push(`Файл ${file.name} не является корректным изображением`);
          continue;
        }
        
        try {
          // 5. Получаем размеры изображения
          const dimensions = await getImageDimensions(file);
          console.log('📐 Размеры изображения:', dimensions);
          
          // 6. Валидация размеров
          const dimensionCheck = validateImageDimensions(dimensions.width, dimensions.height);
          if (!dimensionCheck.valid) {
            warnings.push(`${file.name}: ${dimensionCheck.reason}`);
            continue;
          }

          // 7. Определяем нужно ли сжимать
          const needsCompression = file.size > 1024 * 1024 || dimensions.width > 1200; // Сжимаем если больше 1MB или ширина > 1200px
          
          let finalBlob: Blob = file;
          let base64: string;
          let compressed = false;
          
          if (needsCompression) {
            console.log('🗜️ Безопасное сжатие изображения...');
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
            dimensions,
            isSecure: true, // Отмечаем как безопасное после всех проверок
          };
          
          newProcessedImages.push(processedImage);
          console.log('✅ Файл безопасно обработан:', {
            id: processedImage.id,
            name: file.name,
            originalSize: file.size,
            finalSize: finalBlob.size,
            isSecure: processedImage.isSecure
          });
          
        } catch (fileError) {
          console.error('❌ Ошибка обработки файла:', file.name, fileError);
          warnings.push(`Ошибка обработки файла ${file.name}: ${fileError instanceof Error ? fileError.message : 'Неизвестная ошибка'}`);
        }
      }
      
      // Устанавливаем предупреждения безопасности
      if (warnings.length > 0) {
        setSecurityWarnings(warnings);
      }
      
      if (newProcessedImages.length > 0) {
        const updatedImages = [...images, ...newProcessedImages];
        console.log('🔄 Обновляем состояние изображений:', {
          oldCount: images.length,
          newCount: newProcessedImages.length,
          totalCount: updatedImages.length,
          secureImages: newProcessedImages.filter(img => img.isSecure).length
        });
        
        setImages(updatedImages);
        onImagesChange(updatedImages);
        
        console.log('✅ Все файлы безопасно обработаны');
      } else {
        console.warn('⚠️ Ни один файл не был обработан');
        if (!error && warnings.length === 0) {
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
  }, [images, maxFiles, maxSizeBytes, acceptedFormats, onImagesChange, error]);

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
      console.log('📂 Файлы перетащены для безопасной обработки:', e.dataTransfer.files.length);
      processFiles(e.dataTransfer.files);
    }
  }, [disabled, processFiles]);

  // File input handler
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      console.log('📂 Файлы выбраны для безопасной обработки:', e.target.files.length);
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
            <span className="text-gray-600">Безопасная обработка изображений...</span>
          </div>
        ) : (
          <>
            <div className="w-8 h-8 text-gray-400 mx-auto mb-2">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="text-gray-600 mb-2">
              Перетащите изображения сюда или нажмите для выбора
            </p>
            <p className="text-sm text-gray-500">
              До {maxFiles} файлов, максимум {formatFileSize(maxSizeBytes)} каждый
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Поддерживаемые форматы: JPEG, PNG, WebP • Безопасная проверка содержимого
            </p>
            
            {/* Индикатор безопасности */}
            <div className="flex items-center justify-center mt-2 text-xs text-green-600">
              <Shield className="w-3 h-3 mr-1" />
              <span>Автоматическая проверка безопасности</span>
            </div>
          </>
        )}
      </div>

      {/* Security Warnings */}
      {securityWarnings.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-orange-800">Предупреждения безопасности:</h4>
              <ul className="text-xs text-orange-700 mt-1 space-y-1">
                {securityWarnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setSecurityWarnings([])}
              className="text-orange-400 hover:text-orange-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
                <Image
                  src={image.preview}
                  alt={`Preview ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
                
                {/* Security Badge */}
                {image.isSecure && (
                  <div className="absolute top-2 left-2">
                    <div className="bg-green-500 text-white p-1 rounded-full" title="Безопасно проверено">
                      <Shield className="w-3 h-3" />
                    </div>
                  </div>
                )}
                
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
                  <div className="absolute bottom-2 right-2">
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
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
                <div className="flex justify-between items-center mb-1">
                  <span>{image.dimensions.width}×{image.dimensions.height}</span>
                  <span>
                    {image.compressed 
                      ? `${formatFileSize(image.compressedSize)} (было ${formatFileSize(image.originalSize)})`
                      : formatFileSize(image.originalSize)
                    }
                  </span>
                </div>
                <div className="flex items-center text-green-600">
                  <Shield className="w-3 h-3 mr-1" />
                  <span>Проверено</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {images.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
            <span>
              Загружено: {images.length} из {maxFiles} изображений
            </span>
            <span>
              Общий размер: {formatFileSize(images.reduce((sum, img) => sum + img.compressedSize, 0))}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <div>
              {images.some(img => img.compressed) && (
                <span className="text-blue-600">
                  ✓ Некоторые изображения автоматически сжаты
                </span>
              )}
            </div>
            <div className="flex items-center text-green-600">
              <Shield className="w-3 h-3 mr-1" />
              <span>Все изображения проверены на безопасность</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}