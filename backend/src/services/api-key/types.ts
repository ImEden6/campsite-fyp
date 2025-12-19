// API Key Service Types and Interfaces

export interface IApiKeyService {
  createApiKey(data: CreateApiKeyData): Promise<ApiKeyWithPlainKey>;
  validateApiKey(key: string): Promise<ApiKeyValidation>;
  revokeApiKey(keyId: string): Promise<void>;
  rotateApiKey(keyId: string): Promise<ApiKeyWithPlainKey>;
  getApiKeyUsage(keyId: string): Promise<ApiKeyUsage>;
  listApiKeys(createdBy?: string): Promise<ApiKey[]>;
  getApiKeyById(keyId: string): Promise<ApiKey | null>;
}

export interface CreateApiKeyData {
  name: string;
  permissions: string[];
  rateLimit?: number;
  expiresAt?: Date;
  createdBy: string;
}

export interface ApiKey {
  id: string;
  name: string;
  permissions: string[];
  rateLimit: number;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyWithPlainKey extends ApiKey {
  key: string; // Plain text key, only returned on creation
}

export interface ApiKeyValidation {
  valid: boolean;
  keyId?: string;
  permissions?: string[];
  rateLimit?: number;
  error?: string;
}

export interface ApiKeyUsage {
  keyId: string;
  name: string;
  totalRequests: number;
  requestsToday: number;
  requestsThisHour: number;
  lastUsedAt: Date | null;
  rateLimit: number;
  rateLimitRemaining: number;
}

export interface RateLimit {
  limit: number;
  remaining: number;
  resetAt: Date;
}
