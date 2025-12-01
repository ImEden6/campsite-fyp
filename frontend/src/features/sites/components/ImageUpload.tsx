/**
 * ImageUpload Component
 * Handles image upload with drag-and-drop and preview
 */

import { useState, useRef, DragEvent } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  existingImages: string[];
  onImagesChange: (images: string[]) => void;
  onNewImagesChange: (files: File[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  existingImages,
  onImagesChange,
  onNewImagesChange,
  maxImages = 10,
  maxSizeMB = 5,
}) => {
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalImages = existingImages.length + newImagePreviews.length;

  const validateFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return `${file.name} is not an image file`;
    }

    // Check file size
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > maxSizeMB) {
      return `${file.name} is too large (max ${maxSizeMB}MB)`;
    }

    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;

    setError('');

    const filesArray = Array.from(files);
    const remainingSlots = maxImages - totalImages;

    if (filesArray.length > remainingSlots) {
      setError(`You can only upload ${remainingSlots} more image(s)`);
      return;
    }

    // Validate all files
    for (const file of filesArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    // Create previews
    const newPreviews: string[] = [];
    const newFiles: File[] = [];

    filesArray.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string);
          newFiles.push(file);

          // Update state when all files are read
          if (newPreviews.length === filesArray.length) {
            const updatedPreviews = [...newImagePreviews, ...newPreviews];
            const updatedFiles = [...newImageFiles, ...newFiles];
            setNewImagePreviews(updatedPreviews);
            setNewImageFiles(updatedFiles);
            onNewImagesChange(updatedFiles);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleRemoveExistingImage = (index: number) => {
    const updatedImages = existingImages.filter((_, i) => i !== index);
    onImagesChange(updatedImages);
  };

  const handleRemoveNewImage = (index: number) => {
    const updatedPreviews = newImagePreviews.filter((_, i) => i !== index);
    const updatedFiles = newImageFiles.filter((_, i) => i !== index);
    setNewImagePreviews(updatedPreviews);
    setNewImageFiles(updatedFiles);
    onNewImagesChange(updatedFiles);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }
          ${totalImages >= maxImages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        onClick={totalImages < maxImages ? handleBrowseClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInputChange}
          className="hidden"
          disabled={totalImages >= maxImages}
        />

        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
            <Upload className="text-gray-400" size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {totalImages >= maxImages
                ? `Maximum ${maxImages} images reached`
                : 'Drop images here or click to browse'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PNG, JPG, GIF up to {maxSizeMB}MB ({maxImages - totalImages} remaining)
            </p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Image Previews */}
      {(existingImages.length > 0 || newImagePreviews.length > 0) && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Images ({totalImages}/{maxImages})
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Existing Images */}
            {existingImages.map((url, index) => (
              <div key={`existing-${index}`} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  <img
                    src={url}
                    alt={`Site image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveExistingImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <X size={16} />
                </button>
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                    Primary
                  </div>
                )}
              </div>
            ))}

            {/* New Images */}
            {newImagePreviews.map((preview, index) => (
              <div key={`new-${index}`} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                  <img
                    src={preview}
                    alt={`New image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveNewImage(index)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  aria-label="Remove image"
                >
                  <X size={16} />
                </button>
                <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  New
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalImages === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="text-gray-400" size={32} />
          </div>
          <p className="text-sm text-gray-500">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
};
