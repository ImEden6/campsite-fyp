import type { Site, SiteType, SiteStatus } from '@shared/types';

export interface SiteFilters {
    type?: SiteType[] | undefined;
    status?: SiteStatus[] | undefined;
    amenities?: string[] | undefined;
    priceRange?: { min: number; max: number } | undefined;
    capacity?: { min: number; max: number } | undefined;
    searchTerm?: string | undefined;
    isPetFriendly?: boolean | undefined;
    hasElectricity?: boolean | undefined;
    hasWater?: boolean | undefined;
    hasSewer?: boolean | undefined;
    hasWifi?: boolean | undefined;
}

export interface AvailabilityParams {
    startDate: string;
    endDate: string;
    siteType?: SiteType | undefined;
    guests?: number | undefined;
}

export interface SiteAvailability extends Site {
    isAvailable: boolean;
    unavailableDates?: string[] | undefined;
    nextAvailableDate?: string | undefined;
}
