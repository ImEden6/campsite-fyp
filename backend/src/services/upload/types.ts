// Upload Service Types

export interface IUploadService {
  uploadAvatar(file: Express.Multer.File, userId: string): Promise<UploadResult>;
  /** Campsite listing photo (larger max dimension than avatar). */
  uploadSiteImage(file: Express.Multer.File, siteId: string): Promise<UploadResult>;
  deleteAvatar(key: string): Promise<void>;
  getFileUrl(key: string): string;
}

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  mimeType: string;
}

export interface ImageProcessingOptions {
  width?: number;
  height?: number;
  format?: 'jpeg' | 'png' | 'webp';
  quality?: number;
}
