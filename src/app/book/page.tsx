'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Download, Share2, Menu, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { useBook, sampleBook } from '@/contexts/BookContext';
import BookImageGallery from '@/components/BookImageGallery';

export default function EnhancedBookViewer() {
  const { currentBook, isBookLoading, hasBook } = useBook();
  const [currentView, setCurrentView] = useState<'cover' | 'contents' | 'chapter' | 'gallery'>('cover');
  const [currentChapter, setCurrentChapter] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Определяем книгу для отображения
  const book = currentBook || sampleBook;
  const hasImages = book.images && book.images.length > 0;

  // ✅ ПЕРЕМЕЩЕНА ФУНКЦИЯ В НАЧАЛО КОМПОНЕНТА - доступна везде
  const getImagesForChapter = (chapterIndex: number) => {
    if (!hasImages || !book.images) return [];
    
    const imagesPerChapter = Math.ceil(book.images.length / book.totalChapters);
    const startIndex = chapterIndex * imagesPerChapter;
    const endIndex = Math.min(startIndex + imagesPerChapter, book.images.length);
    
    return book.images.slice(startIndex, endIndex);
  };

  useEffect(() => {
    // Имитируем загрузку страницы
    const loadingTimer = setTimeout(() => {
      setIsPageLoading(false);
    }, 500);

    // ✅ ИСПРАВЛЕНО: Проверяем корректность индекса главы
    if (currentChapter >= book.chapters.length) {
      setCurrentChapter(0);
    }

    return () => clearTimeout(loadingTimer);
  }, [currentChapter, book.chapters.length]);

  const nextChapter = () => {
    if (currentChapter < book.chapters.length - 1) {
      setCurrentChapter(prev => prev + 1);
    }
  };

  const prevChapter = () => {
    if (currentChapter > 0) {
      setCurrentChapter(prev => prev - 1);
    }
  };

  const goToChapter = (index: number) => {
    setCurrentChapter(index);
    setCurrentView('chapter');
    setShowMenu(false);
  };

  const handleDownloadPDF = () => {
    alert('Функция скачивания PDF будет добавлена в следующих обновлениях!');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: book.title,
        text: `Посмотрите мою персональную книгу &ldquo;${book.title}&rdquo; созданную с помощью ИИ!`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Ссылка скопирована в буфер обмена!');
    }
  };

  // Показываем загрузку только если загружается страница или книга
  if (isPageLoading || isBookLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            {isBookLoading ? 'Подготавливаем вашу книгу...' : 'Загружаем...'}
          </h2>
          {!hasBook && !isBookLoading && (
            <p className="text-gray-600 mt-2">
              Книга не найдена. Показываем демо-версию.
            </p>
          )}
        </div>
      </div>
    );
  }

  // Обложка книги
  if (currentView === 'cover') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
        <style jsx>{`
          .book-3d {
            perspective: 1200px;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .book-wrapper {
            position: relative;
            width: 320px;
            height: 400px;
            transform-style: preserve-3d;
            transform: rotateY(-8deg) rotateX(1deg);
            transition: transform 0.3s ease;
          }

          .book-wrapper:hover {
            transform: rotateY(-5deg) rotateX(0deg);
          }

          .front-cover {
            position: absolute;
            width: 100%;
            height: 100%;
            background: linear-gradient(145deg, #f8f5f0 0%, #f0ebe3 100%);
            border-radius: 8px;
            box-shadow: 
              0 20px 40px rgba(0,0,0,0.3),
              inset 0 1px 0 rgba(255,255,255,0.1);
            transform: translateZ(9px);
            overflow: hidden;
          }

          .front-cover::after {
            content: '';
            position: absolute;
            width: 20px;
            height: 100%;
            background: linear-gradient(to right, #f0ebe3 0%, #f8f5f0 50%, #f0ebe3 100%);
            transform: rotateY(-90deg) translateZ(0px);
            transform-origin: left center;
            left: 0;
            top: 0;
            border-radius: 8px 0 0 8px;
            box-shadow: 
              inset -2px 0 4px rgba(0,0,0,0.4);
          }

          .front-cover::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url('/images/floral-pattern.jpg');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            opacity: 0.4;
            mix-blend-mode: multiply;
          }

          .book-pages {
            position: absolute;
            width: 96%;
            height: 95%;
            background: linear-gradient(to right, #fef7ed 0%, #fefce8 100%);
            transform: translateZ(-4px);
            border-radius: 0 6px 6px 0;
            box-shadow: 
              0 0 0 1px rgba(0,0,0,0.1),
              inset -2px 0 4px rgba(0,0,0,0.1),
              2px 0 6px rgba(0,0,0,0.15);
            top: 2.5%;
            left: 2%;
            overflow: visible;
            border-right: 2px solid #d4af37;
          }

          .gold-edge {
            position: absolute;
            right: -1px;
            top: 0;
            width: 3px;
            height: 100%;
            background: linear-gradient(to bottom, 
              #f4e184 0%, 
              #d4af37 20%, 
              #b8941f 50%, 
              #d4af37 80%, 
              #f4e184 100%);
            border-radius: 0 6px 6px 0;
            box-shadow: 
              1px 0 3px rgba(212, 175, 55, 0.5),
              inset -1px 0 1px rgba(255,255,255,0.3);
          }

          .back-cover-visible {
            position: absolute;
            width: 100%;
            height: 100%;
            background: linear-gradient(145deg, #f8f5f0 0%, #f0ebe3 100%);
            border-radius: 8px;
            transform: translateZ(-8px);
            right: 0px;
            top: 0;
            box-shadow: 
              1px 0 4px rgba(0,0,0,0.2),
              inset 1px 0 2px rgba(255,255,255,0.05);
          }

          .back-cover-visible::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url('/images/floral-pattern.jpg');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            opacity: 0.3;
            mix-blend-mode: multiply;
            border-radius: 8px;
          }

          .visible-pages {
            position: absolute;
            right: -2px;
            top: 5%;
            width: 3px;
            height: 90%;
            background: repeating-linear-gradient(
              to bottom,
              #fefce8 0px,
              #fefce8 0.8px,
              #f8f4e6 0.8px,
              #f8f4e6 1.6px
            );
            border-radius: 0 2px 2px 0;
            box-shadow: 
              1px 0 2px rgba(0,0,0,0.15),
              inset -0.5px 0 0.5px rgba(0,0,0,0.1);
            border-right: 0.5px solid #e8dcc6;
            transform: translateZ(-1px);
          }

          .visible-pages::before {
            content: '';
            position: absolute;
            right: -1px;
            top: 2%;
            width: 1.5px;
            height: 96%;
            background: repeating-linear-gradient(
              to bottom,
              #f8f4e6 0px,
              #f8f4e6 0.8px,
              #f0ebe3 0.8px,
              #f0ebe3 1.6px
            );
            border-radius: 0 1px 1px 0;
            box-shadow: 
              0.5px 0 1px rgba(0,0,0,0.1);
            border-right: 0.5px solid #ddd4c0;
          }

          .visible-pages::after {
            content: '';
            position: absolute;
            right: -0.5px;
            top: 3%;
            width: 0.5px;
            height: 94%;
            background: repeating-linear-gradient(
              to bottom,
              #f0ebe3 0px,
              #f0ebe3 0.8px,
              #e8e2d9 0.8px,
              #e8e2d9 1.6px
            );
            border-radius: 0 0.5px 0.5px 0;
            box-shadow: 0.5px 0 0.5px rgba(0,0,0,0.08);
          }

          .page-layer {
            position: absolute;
            background: #fefce8;
            border-radius: 0 5px 5px 0;
            box-shadow: inset -1px 0 2px rgba(0,0,0,0.05);
          }

          .page-layer-1 {
            width: 94%;
            height: 92%;
            transform: translateZ(-2px);
            top: 4%;
            left: 3%;
          }

          .page-layer-2 {
            width: 92%;
            height: 90%;
            transform: translateZ(-3px);
            top: 5%;
            left: 4%;
          }

          .page-layer-3 {
            width: 90%;
            height: 88%;
            transform: translateZ(-4px);
            top: 6%;
            left: 5%;
          }

          .book-highlight {
            position: absolute;
            top: 60px;
            left: 80px;
            width: 30px;
            height: 100px;
            background: linear-gradient(45deg, transparent, rgba(255,255,255,0.08), transparent);
            transform: rotate(20deg);
            border-radius: 15px;
            filter: blur(1px);
          }

          .corner-decoration {
            position: absolute;
            width: 20px;
            height: 20px;
            border: 2px solid #eab308;
            box-shadow: 0 0 8px rgba(234, 179, 8, 0.3);
          }

          .corner-tl { top: 12px; left: 12px; border-right: none; border-bottom: none; }
          .corner-tr { top: 12px; right: 12px; border-left: none; border-bottom: none; }
          .corner-bl { bottom: 12px; left: 12px; border-right: none; border-top: none; }
          .corner-br { bottom: 12px; right: 12px; border-left: none; border-top: none; }

          .book-shadow {
            position: absolute;
            width: 300px;
            height: 150px;
            background: radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, transparent 80%);
            bottom: -50px;
            left: 50%;
            transform: translateX(-50%);
            filter: blur(20px);
            z-index: -1;
          }

          .bookmark-ribbon {
            position: absolute;
            width: 8px;
            height: 60px;
            background: linear-gradient(to bottom, #d4af37 0%, #b8941f 100%);
            top: -10px;
            left: 50%;
            transform: translateX(-50%) translateZ(10px);
            border-radius: 0 0 4px 4px;
            box-shadow: 
              0 2px 6px rgba(0,0,0,0.3),
              inset 0 1px 0 rgba(255,255,255,0.2);
          }

          .bookmark-ribbon::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 0;
            height: 0;
            border-left: 4px solid transparent;
            border-right: 4px solid transparent;
            border-top: 8px solid #9d7c0d;
            transform: translateY(100%);
          }
        `}</style>

        <div className="max-w-md mx-auto">
          {/* Индикатор типа книги */}
          {!hasBook && (
            <div className="text-center mb-4">
              <span className="inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                📖 Демо-версия
              </span>
            </div>
          )}

          {/* Реалистичная 3D книга */}
          <div className="book-3d">
            <div className="book-wrapper">
              <div className="book-shadow"></div>
              <div className="back-cover-visible"></div>
              
              <div className="book-pages">
                <div className="page-layer page-layer-1"></div>
                <div className="page-layer page-layer-2"></div>
                <div className="page-layer page-layer-3"></div>
                <div className="gold-edge"></div>
              </div>

              <div className="visible-pages"></div>
              <div className="bookmark-ribbon"></div>
              
              <div className="front-cover">
                <div className="absolute inset-4 border-2 border-yellow-400/30 rounded-md">
                  <div className="absolute inset-2 border border-yellow-400/20 rounded-sm"></div>
                </div>
                
                <div className="corner-decoration corner-tl"></div>
                <div className="corner-decoration corner-tr"></div>
                <div className="corner-decoration corner-bl"></div>
                <div className="corner-decoration corner-br"></div>
                
                <div className="relative z-10 h-full flex flex-col justify-between p-8 text-center">
                  
                  <div>
                    {book.author && (
                      <div 
                        className="text-sm tracking-[0.2em] uppercase font-medium" 
                        style={{color: '#334155 !important'}}
                      >
                        {book.author}
                      </div>
                    )}
                    <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-yellow-600 to-transparent mx-auto mt-3"></div>
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-center">
                    <h1 
                      className="text-2xl font-serif leading-tight mb-2 px-2 font-bold" 
                      style={{color: '#0f172a !important'}}
                    >
                      {book.title}
                    </h1>
                    
                    {book.dedicatedTo && (
                      <p 
                        className="text-sm italic mt-3" 
                        style={{color: '#334155 !important'}}
                      >
                        {book.dedicatedTo}
                      </p>
                    )}
                    
                    <div className="flex justify-center mt-4">
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-yellow-600 rounded-full"></div>
                        <div className="w-2 h-1 bg-yellow-500 rounded-full"></div>
                        <div className="w-1 h-1 bg-yellow-600 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="w-16 h-0.5 bg-gradient-to-r from-transparent via-yellow-600 to-transparent mx-auto mb-4"></div>
                    <div 
                      className="text-xs tracking-wider font-medium" 
                      style={{color: '#334155 !important'}}
                    >
                      VELORABOOK • 2025
                    </div>
                  </div>
                </div>
                
                <div className="book-highlight"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-amber-900/10 via-transparent to-amber-100/5 pointer-events-none"></div>
              </div>
            </div>
          </div>
          
          <div className="mt-8 space-y-4">
            <button
              onClick={() => setCurrentView('contents')}
              className="w-full bg-slate-800 text-yellow-100 py-3 px-6 rounded-lg font-serif hover:bg-slate-700 transition-all duration-300 shadow-lg"
            >
              Открыть книгу
            </button>
            
            <button
              onClick={() => {
                setCurrentView('chapter');
                setCurrentChapter(0);
              }}
              className="w-full border-2 border-slate-800 text-slate-800 py-3 px-6 rounded-lg font-serif hover:bg-slate-800 hover:text-yellow-100 transition-all duration-300"
            >
              Читать с первой главы
            </button>
          </div>
          
          <div className="flex justify-center space-x-4 mt-6">
            <button 
              onClick={handleShare}
              className="flex items-center px-4 py-2 text-slate-600 border border-slate-300 rounded-lg hover:bg-slate-50 transition-all"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Поделиться
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="flex items-center px-4 py-2 bg-slate-800 text-yellow-100 rounded-lg hover:bg-slate-700 transition-all"
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </button>
          </div>
          
          <div className="text-center mt-6">
            <Link href="/create" className="text-slate-600 hover:text-slate-800 text-sm">
              ← Создать новую книгу
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Оглавление
  if (currentView === 'contents') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setCurrentView('cover')}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              К обложке
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Оглавление</h1>
            <div className="w-20"></div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {book.title}
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-blue-500 mx-auto mb-4"></div>
              
              {/* Book Info */}
              <div className="flex justify-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <span>📖</span>
                  <span>{book.totalChapters} глав</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span>⏱️</span>
                  <span>~{book.estimatedReadTime} мин</span>
                </div>
                {hasImages && (
                  <div className="flex items-center space-x-1">
                    <span>🖼️</span>
                    <span>{book.images!.length} фото</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {book.chapters.map((chapter, index) => (
                <button
                  key={chapter.number}
                  onClick={() => goToChapter(index)}
                  className="w-full text-left p-4 rounded-lg hover:bg-gray-50 transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-500 mb-1 block">
                        Глава {chapter.number}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                        {chapter.title}
                      </h3>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                </button>
              ))}
              
              {/* Gallery Link */}
              {hasImages && (
                <button
                  onClick={() => setCurrentView('gallery')}
                  className="w-full text-left p-4 rounded-lg hover:bg-gray-50 transition-all group border-t border-gray-200 mt-4 pt-6"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-500 mb-1 block">
                        Дополнительно
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors flex items-center space-x-2">
                        <ImageIcon className="w-5 h-5" />
                        <span>Фотогалерея ({book.images!.length})</span>
                      </h3>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
                  </div>
                </button>
              )}
            </div>

            <div className="text-center mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={() => {
                  setCurrentView('chapter');
                  setCurrentChapter(0);
                }}
                className="bg-gradient-to-r from-purple-500 to-blue-500 text-white py-3 px-8 rounded-lg font-semibold hover:from-purple-600 hover:to-blue-600 transition-all"
              >
                Начать чтение
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Галерея изображений
  if (currentView === 'gallery') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => setCurrentView('contents')}
              className="flex items-center text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              К оглавлению
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Фотогалерея</h1>
            <div className="w-20"></div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Изображения из книги &ldquo;{book.title}&rdquo;
              </h2>
              <p className="text-gray-600">
                {hasImages ? `${book.images!.length} изображений в вашей истории` : 'Изображения не загружены'}
              </p>
            </div>

            {hasImages ? (
              <BookImageGallery images={book.images!} />
            ) : (
              <div className="text-center py-12">
                <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Изображения не найдены
                </h3>
                <p className="text-gray-600 mb-6">
                  В этой книге нет загруженных изображений. Создайте новую книгу с фотографиями!
                </p>
                <Link href="/create">
                  <button className="bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-6 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all">
                    Создать книгу с фото
                  </button>
                </Link>
              </div>
            )}

            {hasImages && (
              <div className="text-center mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-4">
                  Эти изображения были проанализированы ИИ и органично включены в повествование вашей книги
                </p>
                <button
                  onClick={() => {
                    setCurrentView('chapter');
                    setCurrentChapter(0);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-blue-500 text-white py-2 px-6 rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all"
                >
                  Читать книгу
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Чтение главы
  const currentChapterData = book.chapters[currentChapter];
  
  // ✅ ИСПРАВЛЕНО: Добавляем проверку на существование главы
  if (!currentChapterData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Глава не найдена
          </h2>
          <p className="text-gray-600 mb-6">
            Попробуйте вернуться к оглавлению
          </p>
          <button
            onClick={() => setCurrentView('contents')}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-all"
          >
            К оглавлению
          </button>
        </div>
      </div>
    );
  }

  const chapterImages = getImagesForChapter(currentChapter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-semibold text-gray-900">{book.title}</h1>
                <p className="text-sm text-gray-500">
                  Глава {currentChapterData.number} • {currentChapter + 1} из {book.chapters.length}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleShare}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button 
                onClick={handleDownloadPDF}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                <Download className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {showMenu && (
          <div className="absolute top-full left-0 right-0 bg-white shadow-lg border-b z-10">
            <div className="container mx-auto px-4 py-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setCurrentView('cover');
                    setShowMenu(false);
                  }}
                  className="text-left p-3 hover:bg-gray-50 rounded-lg transition-all"
                >
                  🏠 К обложке
                </button>
                <button
                  onClick={() => {
                    setCurrentView('contents');
                    setShowMenu(false);
                  }}
                  className="text-left p-3 hover:bg-gray-50 rounded-lg transition-all"
                >
                  📑 Оглавление
                </button>
                {hasImages && (
                  <button
                    onClick={() => {
                      setCurrentView('gallery');
                      setShowMenu(false);
                    }}
                    className="text-left p-3 hover:bg-gray-50 rounded-lg transition-all col-span-2"
                  >
                    🖼️ Фотогалерея
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <div className="bg-white">
        <div className="container mx-auto px-4">
          <div className="w-full bg-gray-200 h-1">
            <div
              className="bg-gradient-to-r from-purple-500 to-blue-500 h-1 transition-all duration-300"
              style={{ width: `${((currentChapter + 1) / book.chapters.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 md:p-12 min-h-[600px] relative">
            <div className="absolute top-4 right-6 text-sm text-gray-400">
              {currentChapter + 1}
            </div>

            <div className="text-center mb-8 border-b border-gray-200 pb-6">
              <p className="text-sm text-gray-500 mb-2 tracking-wider uppercase">
                Глава {currentChapterData.number}
              </p>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {currentChapterData.title}
              </h1>
              
              {currentChapterData.epigraph && (
                <blockquote className="text-gray-600 italic text-center max-w-md mx-auto">
                  &ldquo;{currentChapterData.epigraph}&rdquo;
                </blockquote>
              )}
            </div>

            {/* Содержимое главы */}
            <div className="prose prose-lg max-w-none">
              {currentChapterData.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="text-gray-700 leading-relaxed mb-6 text-justify">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Изображения главы */}
            {chapterImages.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <BookImageGallery 
                  images={chapterImages} 
                  className="chapter-images"
                />
              </div>
            )}

            {/* Информация об изображениях */}
            {hasImages && chapterImages.length === 0 && currentChapter === book.totalChapters - 1 && (
              <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                <p className="text-gray-600 mb-4">
                  📸 В этой книге есть {book.images!.length} изображений
                </p>
                <button
                  onClick={() => setCurrentView('gallery')}
                  className="text-purple-600 hover:text-purple-700 underline"
                >
                  Посмотреть все изображения →
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-8">
            <button
              onClick={prevChapter}
              disabled={currentChapter === 0}
              className="flex items-center px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Предыдущая глава
            </button>

            <div className="text-center">
              <div className="flex space-x-2">
                {book.chapters.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentChapter(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      currentChapter === index
                        ? 'bg-purple-600'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>

            {currentChapter === book.chapters.length - 1 ? (
              <Link href="/create">
                <button className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all shadow-sm">
                  Создать новую книгу
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              </Link>
            ) : (
              <button
                onClick={nextChapter}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all shadow-sm"
              >
                Следующая глава
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}