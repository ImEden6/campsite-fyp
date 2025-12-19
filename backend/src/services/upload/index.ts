// Upload Service Export

import { LocalUploadService } from './local';

export const uploadService = new LocalUploadService();
export { IUploadService, UploadResult } from './types';
