import React, { memo, useMemo, useCallback, useState, useEffect, Suspense, lazy } from 'react'
import { Loader2, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

// =================================
// Lazy Loading Components
// =================================

// Ленивая загрузка тяжелых компонентов
export const LazyBookViewer = lazy(() => import('@/app/book/page'))
export const LazyImageUploader = lazy(() => import('@/components/ImageUploader'))
export const LazyBookImageGallery = lazy(() => import('@/components/BookImageGallery'))

// =================================
// Loading Components
// =================================

// Универсальный компонент загрузки
export const LoadingSpinner = memo(({ 
  size = 'md', 
  text, 
  className = '' 
}: {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  className?: string
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6', 
    lg: 'w-8 h-8'
  }

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-purple-600`} />
      {text && <span className="text-gray-600">{text}</span>}
    </div>
  )
})

LoadingSpinner.displayName = 'LoadingSpinner'

// Скелетон для загрузки контента
export const SkeletonLoader = memo(({ 
  lines = 3, 
  className = '',
  animated = true 
}: {
  lines?: number
  className?: string
  animated?: boolean
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }, (_, i) => (
        <div 
          key={i}
          className={`h-4 bg-gray-200 rounded ${animated ? 'animate-pulse' : ''}`}
          style={{ width: `${85 + Math.random() * 15}%` }}
        />
      ))}
    </div>
  )
})

SkeletonLoader.displayName = 'SkeletonLoader'

// =================================
// Optimized Image Component
// =================================

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
  fallbackSrc?: string
}

export const OptimizedImage = memo(({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  onLoad,
  onError,
  fallbackSrc = '/images/placeholder.jpg'
}: OptimizedImageProps) => {
  const [imageSrc, setImageSrc] = useState(src)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    setHasError(true)
    setIsLoading(false)
    setImageSrc(fallbackSrc)
    onError?.()
  }, [fallbackSrc, onError])

  useEffect(() => {
    setImageSrc(src)
    setHasError(false)
    setIsLoading(true)
  }, [src])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
      )}
      
      <Image
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${hasError ? 'filter grayscale' : ''}`}
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      />
      
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-500 text-sm">Не удалось загрузить</span>
        </div>
      )}
    </div>
  )
})

OptimizedImage.displayName = 'OptimizedImage'

// =================================
// Virtual List Component
// =================================

interface VirtualListItem {
  id: string
  height: number
  data: any
}

interface VirtualListProps {
  items: VirtualListItem[]
  containerHeight: number
  renderItem: (item: VirtualListItem, index: number) => React.ReactNode
  overscan?: number
  className?: string
}

export const VirtualList = memo(({
  items,
  containerHeight,
  renderItem,
  overscan = 5,
  className = ''
}: VirtualListProps) => {
  const [scrollTop, setScrollTop] = useState(0)

  const itemPositions = useMemo(() => {
    let position = 0
    return items.map(item => {
      const currentPosition = position
      position += item.height
      return currentPosition
    })
  }, [items])

  const totalHeight = useMemo(() => 
    items.reduce((sum, item) => sum + item.height, 0), [items]
  )

  const visibleRange = useMemo(() => {
    const start = itemPositions.findIndex(pos => pos + items[itemPositions.indexOf(pos)]?.height > scrollTop)
    const end = itemPositions.findIndex(pos => pos > scrollTop + containerHeight)
    
    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length, (end === -1 ? items.length : end) + overscan)
    }
  }, [scrollTop, containerHeight, itemPositions, items, overscan])

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end).map((item, index) => ({
      ...item,
      index: visibleRange.start + index,
      top: itemPositions[visibleRange.start + index]
    }))
  }, [items, visibleRange, itemPositions])

  return (
    <div 
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(item => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              top: item.top,
              height: item.height,
              width: '100%'
            }}
          >
            {renderItem(item, item.index)}
          </div>
        ))}
      </div>
    </div>
  )
})

VirtualList.displayName = 'VirtualList'

// =================================
// Collapsible Component
// =================================

interface CollapsibleProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
  onToggle?: (isOpen: boolean) => void
}

export const Collapsible = memo(({
  title,
  children,
  defaultOpen = false,
  className = '',
  onToggle
}: CollapsibleProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const handleToggle = useCallback(() => {
    const newState = !isOpen
    setIsOpen(newState)
    onToggle?.(newState)
  }, [isOpen, onToggle])

  return (
    <div className={`border border-gray-200 rounded-lg ${className}`}>
      <button
        onClick={handleToggle}
        className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
      >
        <span className="font-medium">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      
      {isOpen && (
        <div className="p-4 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  )
})

Collapsible.displayName = 'Collapsible'

// =================================
// Memoized Form Components
// =================================

interface MemoizedInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
  className?: string
  disabled?: boolean
  onBlur?: () => void
  onFocus?: () => void
}

export const MemoizedInput = memo(({
  value,
  onChange,
  placeholder = '',
  type = 'text',
  className = '',
  disabled = false,
  onBlur,
  onFocus
}: MemoizedInputProps) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }, [onChange])

  return (
    <input
      type={type}
      value={value}
      onChange={handleChange}
      onBlur={onBlur}
      onFocus={onFocus}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    />
  )
})

MemoizedInput.displayName = 'MemoizedInput'

interface MemoizedTextareaProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
  disabled?: boolean
  maxLength?: number
}

export const MemoizedTextarea = memo(({
  value,
  onChange,
  placeholder = '',
  rows = 4,
  className = '',
  disabled = false,
  maxLength
}: MemoizedTextareaProps) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
  }, [onChange])

  const characterCount = useMemo(() => value.length, [value.length])

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        maxLength={maxLength}
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
      />
      
      {maxLength && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-500">
          {characterCount}/{maxLength}
        </div>
      )}
    </div>
  )
})

MemoizedTextarea.displayName = 'MemoizedTextarea'

// =================================
// Progress Component
// =================================

interface ProgressProps {
  value: number
  max: number
  className?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
  color?: 'blue' | 'green' | 'purple' | 'red'
}

export const Progress = memo(({
  value,
  max,
  className = '',
  showPercentage = true,
  size = 'md',
  color = 'purple'
}: ProgressProps) => {
  const percentage = useMemo(() => 
    Math.min(100, Math.max(0, (value / max) * 100)), [value, max]
  )

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500'
  }

  return (
    <div className={className}>
      {showPercentage && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Прогресс</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      
      <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full transition-all duration-300 ease-out ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
})

Progress.displayName = 'Progress'

// =================================
// Suspense Wrappers
// =================================

export const SuspenseWrapper = memo(({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode
  fallback?: React.ReactNode 
}) => (
  <Suspense 
    fallback={fallback || <LoadingSpinner size="lg" text="Загружаем компонент..." />}
  >
    {children}
  </Suspense>
))

SuspenseWrapper.displayName = 'SuspenseWrapper'

// =================================
// Performance Hook
// =================================

export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      if (renderTime > 16) { // Если рендер занял больше одного фрейма (16мс)
        console.warn(`⚠️ Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`)
      }
    }
  })
}

// =================================
// Debounced Input Hook
// =================================

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

// =================================
// Intersection Observer Hook
// =================================

export function useIntersectionObserver(
  ref: React.RefObject<Element>,
  options: IntersectionObserverInit = {}
): boolean {
  const [isIntersecting, setIsIntersecting] = useState(false)

  useEffect(() => {
    if (!ref.current) return

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, options)

    observer.observe(ref.current)

    return () => observer.disconnect()
  }, [ref, options])

  return isIntersecting
}

// =================================
// Optimized List Component
// =================================

interface OptimizedListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T, index: number) => string
  className?: string
  emptyMessage?: string
  loadingMessage?: string
  isLoading?: boolean
}

export function OptimizedList<T>({
  items,
  renderItem,
  keyExtractor,
  className = '',
  emptyMessage = 'Нет элементов',
  loadingMessage = 'Загружаем...',
  isLoading = false
}: OptimizedListProps<T>) {
  const memoizedItems = useMemo(() => 
    items.map((item, index) => ({
      key: keyExtractor(item, index),
      node: renderItem(item, index)
    })), [items, renderItem, keyExtractor]
  )

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center py-8 ${className}`}>
        <LoadingSpinner text={loadingMessage} />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className={className}>
      {memoizedItems.map(({ key, node }) => (
        <React.Fragment key={key}>
          {node}
        </React.Fragment>
      ))}
    </div>
  )
}