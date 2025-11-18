import { useState } from 'react';

interface ImageGalleryProps {
  images: string[];
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export default function ImageGallery({ 
  images, 
  productName, 
  isOpen, 
  onClose, 
  initialIndex = 0 
}: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    resetZoom();
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    resetZoom();
  };

  const resetZoom = () => {
    setIsZoomed(false);
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleImageClick = () => {
    if (isZoomed) {
      resetZoom();
    } else {
      setIsZoomed(true);
      setZoomScale(2);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Pinch zoom gesture
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      // Store initial distance for pinch calculations
      (e.currentTarget as any).initialDistance = distance;
      (e.currentTarget as any).initialScale = zoomScale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2) {
      // Pinch zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const initialDistance = (e.currentTarget as any).initialDistance;
      const initialScale = (e.currentTarget as any).initialScale;
      
      if (initialDistance) {
        const scale = Math.max(1, Math.min(4, (distance / initialDistance) * initialScale));
        setZoomScale(scale);
        setIsZoomed(scale > 1);
      }
    } else if (e.touches.length === 1 && isZoomed) {
      // Pan when zoomed
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const deltaX = (touch.clientX - rect.left - centerX) / zoomScale;
      const deltaY = (touch.clientY - rect.top - centerY) / zoomScale;
      
      setPanPosition({ x: deltaX, y: deltaY });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/70 to-transparent p-4">
        <div className="flex justify-between items-center">
          <div className="text-white">
            <h3 className="font-semibold">{productName}</h3>
            {images.length > 1 && (
              <p className="text-sm text-gray-300">
                {currentIndex + 1} / {images.length}
              </p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-300 p-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button 
            onClick={prevImage}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 p-3 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={nextImage}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 text-white hover:text-gray-300 p-3 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Main Image */}
      <div 
        className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-pointer"
        onClick={handleImageClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <img 
          src={currentImage}
          alt={`${productName} ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain transition-transform duration-200"
          style={{
            transform: `scale(${zoomScale}) translate(${panPosition.x}px, ${panPosition.y}px)`,
            touchAction: 'none'
          }}
          onError={(e) => {
            console.error('Image failed to load:', currentImage);
          }}
        />
      </div>

      {/* Zoom indicator */}
      {isZoomed && (
        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
          {Math.round(zoomScale * 100)}%
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs">
        {isZoomed ? 
          'Tap to zoom out' : 
          'Tap to zoom in'
        }
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black/70 rounded-full px-4 py-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setCurrentIndex(index);
                resetZoom();
              }}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}