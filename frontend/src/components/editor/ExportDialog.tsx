/**
 * Export Dialog
 * Dialog for exporting the map as PNG image or JSON data.
 */

import { useState, useCallback } from 'react';
import {
    X,
    Download,
    Image,
    FileJson,
    Loader2,
    Check,
} from 'lucide-react';

import { useMapStore } from '@/stores/mapStore';

// ============================================================================
// TYPES
// ============================================================================

interface ExportDialogProps {
    isOpen: boolean;
    onClose: () => void;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

type ExportFormat = 'png' | 'json';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ExportDialog({
    isOpen,
    onClose,
    canvasRef,
}: ExportDialogProps) {
    const [format, setFormat] = useState<ExportFormat>('png');
    const [isExporting, setIsExporting] = useState(false);
    const [exportSuccess, setExportSuccess] = useState(false);
    const [pngScale, setPngScale] = useState(1);
    const [includeBackground, setIncludeBackground] = useState(true);

    const { currentMap } = useMapStore();

    // Export as PNG
    const exportAsPng = useCallback(async () => {
        const canvas = canvasRef.current;
        if (!canvas) {
            console.error('[ExportDialog] Canvas ref is null');
            return;
        }

        setIsExporting(true);

        try {
            let dataUrl: string;

            if (pngScale === 1 && includeBackground) {
                // Simple case: no scaling, include background - just export directly
                dataUrl = canvas.toDataURL('image/png');
            } else {
                // Create a temporary canvas for the export with scaling
                const exportCanvas = document.createElement('canvas');
                const exportCtx = exportCanvas.getContext('2d');

                if (!exportCtx) {
                    throw new Error('Could not create export canvas context');
                }

                // Set export canvas size based on scale
                const exportWidth = canvas.width * pngScale;
                const exportHeight = canvas.height * pngScale;
                exportCanvas.width = exportWidth;
                exportCanvas.height = exportHeight;

                // If not including background, keep transparent
                // Otherwise, fill with white or copy the original background
                if (includeBackground) {
                    // Draw a white background first (or could sample the original)
                    exportCtx.fillStyle = '#ffffff';
                    exportCtx.fillRect(0, 0, exportWidth, exportHeight);
                }
                // else: leave transparent (default for empty canvas)

                // Scale and draw the original canvas content
                exportCtx.scale(pngScale, pngScale);
                exportCtx.drawImage(canvas, 0, 0);

                dataUrl = exportCanvas.toDataURL('image/png');
            }

            // Create download link
            const link = document.createElement('a');
            const scaleSuffix = pngScale !== 1 ? `@${pngScale}x` : '';
            link.download = `${currentMap?.name || 'map'}-export${scaleSuffix}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 2000);
        } catch (error) {
            console.error('[ExportDialog] PNG export failed:', error);
        } finally {
            setIsExporting(false);
        }
    }, [canvasRef, currentMap, pngScale, includeBackground]);


    // Export as JSON
    const exportAsJson = useCallback(() => {
        if (!currentMap) {
            console.error('[ExportDialog] No map to export');
            return;
        }

        setIsExporting(true);

        try {
            // Create export data
            const exportData = {
                version: '1.0',
                exportedAt: new Date().toISOString(),
                map: {
                    ...currentMap,
                    // Ensure dates are serialized properly
                    createdAt: currentMap.createdAt?.toISOString?.() || currentMap.createdAt,
                    updatedAt: currentMap.updatedAt?.toISOString?.() || currentMap.updatedAt,
                    modules: currentMap.modules.map((m) => ({
                        ...m,
                        createdAt: (m.createdAt as Date)?.toISOString?.() || m.createdAt,
                        updatedAt: (m.updatedAt as Date)?.toISOString?.() || m.updatedAt,
                    })),
                },
            };

            const jsonString = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            // Create download link
            const link = document.createElement('a');
            link.download = `${currentMap.name || 'map'}-export.json`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            URL.revokeObjectURL(url);

            setExportSuccess(true);
            setTimeout(() => setExportSuccess(false), 2000);
        } catch (error) {
            console.error('[ExportDialog] JSON export failed:', error);
        } finally {
            setIsExporting(false);
        }
    }, [currentMap]);

    // Handle export action
    const handleExport = useCallback(() => {
        if (format === 'png') {
            exportAsPng();
        } else {
            exportAsJson();
        }
    }, [format, exportAsPng, exportAsJson]);

    if (!isOpen) {
        return null;
    }

    return (
        <div className="export-dialog__overlay" onClick={onClose}>
            <div
                className="export-dialog"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="export-dialog-title"
            >
                <div className="export-dialog__header">
                    <h2 id="export-dialog-title" className="export-dialog__title">
                        Export Map
                    </h2>
                    <button
                        className="export-dialog__close"
                        onClick={onClose}
                        aria-label="Close dialog"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="export-dialog__content">
                    <div className="export-dialog__format-selection">
                        <label className="export-dialog__format-label">
                            Export Format
                        </label>
                        <div className="export-dialog__format-options">
                            <button
                                className={`export-dialog__format-option ${format === 'png' ? 'export-dialog__format-option--selected' : ''}`}
                                onClick={() => setFormat('png')}
                            >
                                <Image size={24} />
                                <span>PNG Image</span>
                            </button>
                            <button
                                className={`export-dialog__format-option ${format === 'json' ? 'export-dialog__format-option--selected' : ''}`}
                                onClick={() => setFormat('json')}
                            >
                                <FileJson size={24} />
                                <span>JSON Data</span>
                            </button>
                        </div>
                    </div>

                    {format === 'png' && (
                        <div className="export-dialog__options">
                            <label className="export-dialog__option">
                                <span>Scale</span>
                                <select
                                    value={pngScale}
                                    onChange={(e) =>
                                        setPngScale(Number(e.target.value))
                                    }
                                >
                                    <option value={1}>1x (Original)</option>
                                    <option value={2}>2x (High DPI)</option>
                                    <option value={0.5}>0.5x (Smaller)</option>
                                </select>
                            </label>
                            <label className="export-dialog__option export-dialog__option--checkbox">
                                <input
                                    type="checkbox"
                                    checked={includeBackground}
                                    onChange={(e) =>
                                        setIncludeBackground(e.target.checked)
                                    }
                                />
                                <span>Include background</span>
                            </label>
                        </div>
                    )}

                    {format === 'json' && (
                        <div className="export-dialog__info">
                            <p>
                                Exports all map data including modules,
                                positions, and metadata in JSON format.
                            </p>
                            <p className="export-dialog__info-hint">
                                This file can be imported later to restore the
                                map.
                            </p>
                        </div>
                    )}
                </div>

                <div className="export-dialog__footer">
                    <button
                        className="export-dialog__button export-dialog__button--secondary"
                        onClick={onClose}
                    >
                        Cancel
                    </button>
                    <button
                        className="export-dialog__button export-dialog__button--primary"
                        onClick={handleExport}
                        disabled={isExporting}
                    >
                        {isExporting ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Exporting...
                            </>
                        ) : exportSuccess ? (
                            <>
                                <Check size={16} />
                                Exported!
                            </>
                        ) : (
                            <>
                                <Download size={16} />
                                Export
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ExportDialog;
