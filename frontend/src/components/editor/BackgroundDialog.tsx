/**
 * Background Dialog
 * Dialog for uploading, cropping, and configuring background images.
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Upload, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';
import {
    validateImageSize,
    getImageDimensions,
    estimateCompressedSize,
    processImage,
    formatFileSize,
    type ImageDimensions,
    type CropArea,
} from '@/utils/imageProcessing';
import type { BackgroundLayer, Position, Size } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

export interface BackgroundDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (layer: BackgroundLayer | null, fitBounds: boolean) => void;
    existingLayer?: BackgroundLayer;
}

interface ProcessingState {
    isProcessing: boolean;
    progress: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_FILE_SIZE_MB = 10;
const MAX_DIMENSION = 2000;
const COMPRESSION_QUALITY = 0.8;

// ============================================================================
// COMPONENT
// ============================================================================

export function BackgroundDialog({
    isOpen,
    onClose,
    onConfirm,
    existingLayer,
}: BackgroundDialogProps) {
    // State
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(existingLayer?.imageData || null);
    const [imageDimensions, setImageDimensions] = useState<ImageDimensions | null>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [opacity, setOpacity] = useState(existingLayer?.opacity ?? 1);
    const [fitBounds, setFitBounds] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [processing, setProcessing] = useState<ProcessingState>({ isProcessing: false, progress: '' });

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Cleanup on close
    useEffect(() => {
        if (!isOpen) {
            // Cancel any in-progress processing
            abortControllerRef.current?.abort();
            // Reset state
            setSelectedFile(null);
            setImagePreview(existingLayer?.imageData || null);
            setImageDimensions(null);
            setCrop(undefined);
            setCompletedCrop(undefined);
            setOpacity(existingLayer?.opacity ?? 1);
            setFitBounds(false);
            setError(null);
            setProcessing({ isProcessing: false, progress: '' });
        }
    }, [isOpen, existingLayer]);

    // Handle file selection
    const handleFileSelect = useCallback(async (file: File) => {
        setError(null);

        // Validate file
        const validation = validateImageSize(file, MAX_FILE_SIZE_MB);
        if (!validation.valid) {
            setError(validation.error || 'Invalid file');
            return;
        }

        try {
            setProcessing({ isProcessing: true, progress: 'Loading image...' });

            // Get dimensions
            const dimensions = await getImageDimensions(file);
            setImageDimensions(dimensions);

            // Show estimated compressed size warning for huge images
            const estimatedKB = estimateCompressedSize(dimensions);
            if (estimatedKB > 1000) {
                console.log(`[BackgroundDialog] Large image - estimated compressed size: ${formatFileSize(estimatedKB * 1024)}`);
            }

            // Create preview - revoke old URL first to prevent memory leak
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
            const objectUrl = URL.createObjectURL(file);
            setImagePreview(objectUrl);
            setSelectedFile(file);

            // Reset crop
            setCrop(undefined);
            setCompletedCrop(undefined);
        } catch (err) {
            setError('Failed to load image');
            console.error('[BackgroundDialog] Error loading image:', err);
        } finally {
            setProcessing({ isProcessing: false, progress: '' });
        }
    }, []);

    // Handle file input change
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    // Handle drag and drop
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileSelect(file);
    }, [handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    // Handle confirm
    const handleConfirm = useCallback(async () => {
        if (!selectedFile && !existingLayer) {
            setError('Please select an image');
            return;
        }

        try {
            abortControllerRef.current = new AbortController();
            setProcessing({ isProcessing: true, progress: 'Processing image...' });

            let finalImageData: string;
            let finalDimensions: Size;
            let originalFormat: string;

            if (selectedFile) {
                // Process new image with crop if specified
                let cropArea: CropArea | undefined;
                if (completedCrop && imgRef.current) {
                    // Convert crop to actual pixel coordinates
                    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
                    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
                    cropArea = {
                        x: Math.round(completedCrop.x * scaleX),
                        y: Math.round(completedCrop.y * scaleY),
                        width: Math.round(completedCrop.width * scaleX),
                        height: Math.round(completedCrop.height * scaleY),
                    };
                }

                setProcessing({ isProcessing: true, progress: 'Compressing image...' });
                const processed = await processImage(selectedFile, cropArea, MAX_DIMENSION, COMPRESSION_QUALITY);

                finalImageData = processed.dataUrl;
                finalDimensions = processed.dimensions;
                originalFormat = processed.originalFormat;
            } else if (existingLayer) {
                // Use existing layer data
                finalImageData = existingLayer.imageData;
                finalDimensions = existingLayer.size;
                originalFormat = existingLayer.originalFormat;
            } else {
                throw new Error('No image data');
            }

            // Calculate position (center on current viewport or at origin)
            const position: Position = existingLayer?.position ?? { x: 0, y: 0 };

            const layer: BackgroundLayer = {
                imageData: finalImageData,
                position,
                size: finalDimensions,
                opacity,
                originalSize: imageDimensions || finalDimensions,
                originalFormat,
                locked: true, // Locked by default
            };

            onConfirm(layer, fitBounds);
            onClose();
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                console.log('[BackgroundDialog] Processing cancelled');
            } else {
                setError('Failed to process image');
                console.error('[BackgroundDialog] Error processing image:', err);
            }
        } finally {
            setProcessing({ isProcessing: false, progress: '' });
        }
    }, [selectedFile, existingLayer, completedCrop, opacity, imageDimensions, fitBounds, onConfirm, onClose]);

    // Handle delete existing
    const handleDelete = useCallback(() => {
        onConfirm(null, false);
        onClose();
    }, [onConfirm, onClose]);

    if (!isOpen) return null;

    return (
        <div className="background-dialog__overlay" onClick={onClose}>
            <div className="background-dialog" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="background-dialog__header">
                    <div className="background-dialog__header-content">
                        <ImageIcon size={20} />
                        <h3 className="background-dialog__title">
                            {existingLayer ? 'Edit Background' : 'Add Background Image'}
                        </h3>
                    </div>
                    <button
                        className="background-dialog__close"
                        onClick={onClose}
                        disabled={processing.isProcessing}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="background-dialog__content">
                    {/* Error message */}
                    {error && (
                        <div className="background-dialog__error">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* File upload area */}
                    {!imagePreview && (
                        <div
                            className="background-dialog__upload"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload size={48} strokeWidth={1.5} />
                            <p className="background-dialog__upload-text">
                                Drop an image here or click to browse
                            </p>
                            <p className="background-dialog__upload-hint">
                                JPEG, PNG, WebP • Max {MAX_FILE_SIZE_MB}MB
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleInputChange}
                                hidden
                            />
                        </div>
                    )}

                    {/* Image preview with crop */}
                    {imagePreview && (
                        <>
                            <div className="background-dialog__preview">
                                <ReactCrop
                                    crop={crop}
                                    onChange={(c) => setCrop(c)}
                                    onComplete={(c) => setCompletedCrop(c)}
                                    aspect={undefined}
                                >
                                    <img
                                        ref={imgRef}
                                        src={imagePreview}
                                        alt="Background preview"
                                        className="background-dialog__image"
                                    />
                                </ReactCrop>
                            </div>

                            {/* Image info */}
                            {imageDimensions && (
                                <div className="background-dialog__info">
                                    <span>Original: {imageDimensions.width} × {imageDimensions.height}px</span>
                                    {completedCrop && (
                                        <span>
                                            Crop: {Math.round(completedCrop.width)} × {Math.round(completedCrop.height)}px
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Replace button */}
                            <button
                                className="background-dialog__replace"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={processing.isProcessing}
                            >
                                Replace Image
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleInputChange}
                                hidden
                            />
                        </>
                    )}

                    {/* Controls */}
                    {imagePreview && (
                        <div className="background-dialog__controls">
                            {/* Opacity slider */}
                            <div className="background-dialog__field">
                                <label>
                                    Opacity: {Math.round(opacity * 100)}%
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={opacity}
                                    onChange={(e) => setOpacity(parseFloat(e.target.value))}
                                    className="background-dialog__slider"
                                />
                            </div>

                            {/* Fit bounds checkbox */}
                            <label className="background-dialog__checkbox">
                                <input
                                    type="checkbox"
                                    checked={fitBounds}
                                    onChange={(e) => setFitBounds(e.target.checked)}
                                />
                                <span>Fit map bounds to this image</span>
                            </label>
                        </div>
                    )}

                    {/* Processing indicator */}
                    {processing.isProcessing && (
                        <div className="background-dialog__processing">
                            <Loader2 size={20} className="animate-spin" />
                            <span>{processing.progress}</span>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="background-dialog__footer">
                    {existingLayer && (
                        <button
                            className="background-dialog__button background-dialog__button--danger"
                            onClick={handleDelete}
                            disabled={processing.isProcessing}
                        >
                            Remove Background
                        </button>
                    )}
                    <div className="background-dialog__footer-spacer" />
                    <button
                        className="background-dialog__button background-dialog__button--secondary"
                        onClick={onClose}
                        disabled={processing.isProcessing}
                    >
                        Cancel
                    </button>
                    <button
                        className="background-dialog__button background-dialog__button--primary"
                        onClick={handleConfirm}
                        disabled={processing.isProcessing || (!selectedFile && !existingLayer)}
                    >
                        {processing.isProcessing ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Processing...
                            </>
                        ) : (
                            existingLayer ? 'Update' : 'Add Background'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default BackgroundDialog;
