/**
 * Konva Background Image Component
 * Handles loading and rendering background image
 */

import React, { useState, useEffect } from 'react';
import { Image } from 'react-konva';

interface KonvaBackgroundImageProps {
  imageUrl: string;
  width: number;
  height: number;
}

export const KonvaBackgroundImage: React.FC<KonvaBackgroundImageProps> = ({
  imageUrl,
  width,
  height,
}) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      setImage(img);
    };

    img.onerror = () => {
      console.error('Failed to load background image:', imageUrl);
    };

    img.src = imageUrl;

    return () => {
      // Cleanup: remove image source to prevent memory leaks
      img.src = '';
    };
  }, [imageUrl]);

  if (!image) {
    return null;
  }

  return (
    <Image
      image={image}
      x={0}
      y={0}
      width={width}
      height={height}
      listening={false}
      perfectDrawEnabled={false}
      cache={true}
    />
  );
};

