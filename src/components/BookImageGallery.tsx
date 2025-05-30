'use client';

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import Image from 'next/image';

interface BookImage {
  url: string;
  caption?: string;
  description?: string;
}

interface BookImageGalleryProps {
  images: BookImage[];
  className?: string;
}

interface ImageModalProps {
  image: BookImage;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  currentIndex: number;
  totalImages: number;
}

function ImageModal({ 
  image, 
  isOpen, 
  onClose, 
  onNext, 
  onPrev, 
  currentIndex, 
  totalImages 
}: ImageModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Navigation */}
      {totalImages > 1 && (
        <>
          {onPrev && (
            <button
              onClick={onPrev}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}
          {onNext && (
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 z-10"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
        </>
      )}

      {/* Image Container */}
      <div className="max-w-4xl max-h-full flex flex-col">
        <div className="relative max-h-[80vh] max-w-full">
          <Image
            src={image.url}
            alt={image.caption || 'Изображение из книги'}
            width={800}
            height={600}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
            style={{ width: 'auto', height: 'auto' }}
          />
        </div>
        
        {/* Image Info */}
        {(image.caption || image.description) && (
          <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-4 mt-4 text-center">
            {image.caption && (
              <h3 className="font-semibold text-gray-900 mb-2">{image.caption}</h3>
            )}
            {image.description && (
              <p className="text-gray-700 text-sm">{image.description}</p>
            )}
          </div>
        )}

        {/* Counter */}
        {totalImages > 1 && (
          <div className="text-white text-center mt-2 text-sm">
            {currentIndex + 1} из {totalImages}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookImageGallery({ images, className = '' }: BookImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const openModal = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeModal = () => {
    setSelectedImageIndex(null);
  };

  const nextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const prevImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`space-y-6 ${className}`}>
        {/* Gallery Header */}
        <div className="text-center border-t border-b border-gray-200 py-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">
            Фотогалерея
          </h3>
          <p className="text-sm text-gray-600">
            {images.length} {images.length === 1 ? 'изображение' : 'изображений'}
          </p>
        </div>

        {/* Single Image Layout */}
        {images.length === 1 && (
          <div className="flex justify-center">
            <div className="relative group max-w-md">
              <div className="relative w-full h-64 cursor-zoom-in">
                <Image
                  src={images[0].url}
                  alt={images[0].caption || 'Изображение'}
                  fill
                  className="rounded-lg shadow-lg object-cover transition-transform group-hover:scale-105"
                  onClick={() => openModal(0)}
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
                  <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              {images[0].caption && (
                <p className="text-center text-sm text-gray-600 mt-2 italic">
                  {images[0].caption}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Grid Layout for Multiple Images */}
        {images.length > 1 && (
          <div className={`grid gap-4 ${
            images.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
            images.length === 3 ? 'grid-cols-1 md:grid-cols-3' :
            'grid-cols-2 md:grid-cols-3'
          }`}>
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square relative overflow-hidden rounded-lg shadow-md">
                  <Image
                    src={image.url}
                    alt={image.caption || `Изображение ${index + 1}`}
                    fill
                    className="object-cover cursor-zoom-in transition-transform group-hover:scale-110"
                    onClick={() => openModal(index)}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                {image.caption && (
                  <p className="text-center text-xs text-gray-600 mt-1 truncate">
                    {image.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Description for multiple images */}
        {images.length > 1 && images[0].description && (
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-700 italic">
              {images[0].description}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {selectedImageIndex !== null && (
        <ImageModal
          image={images[selectedImageIndex]}
          isOpen={selectedImageIndex !== null}
          onClose={closeModal}
          onNext={selectedImageIndex < images.length - 1 ? nextImage : undefined}
          onPrev={selectedImageIndex > 0 ? prevImage : undefined}
          currentIndex={selectedImageIndex}
          totalImages={images.length}
        />
      )}
    </>
  );
}

// Utility функции для работы с изображениями в книге
export const BookImageUtils = {
  // Конвертация ProcessedImage в BookImage  
  convertProcessedImages: (processedImages: Array<{
    preview?: string;
    base64: string;
    file: { name: string };
  }>, analysisResults?: string[]): BookImage[] => {
    return processedImages.map((img, index) => ({
      url: img.preview || img.base64,
      caption: `Фотография ${index + 1}`,
      description: analysisResults?.[index] || 'Особенный момент, запечатленный в вашей истории'
    }));
  },

  // Создание заглушки для изображений если их нет
  createPlaceholderImages: (count: number = 3): BookImage[] => {
    return Array.from({ length: count }, (_, index) => ({
      url: `https://via.placeholder.com/400x300/e5e7eb/9ca3af?text=Фото+${index + 1}`,
      caption: `Место для фотографии ${index + 1}`,
      description: 'Здесь может быть ваша фотография'
    }));
  },

  // Проверка валидности URL изображения
  isValidImageUrl: (url: string): boolean => {
    try {
      new URL(url);
      return url.startsWith('data:image/') || 
             url.startsWith('blob:') || 
             url.startsWith('http://') || 
             url.startsWith('https://');
    } catch {
      return false;
    }
  }
};