/**
 * Properties Components
 * Barrel export for all property-related components
 */

// Infrastructure
export { PropertySection } from './PropertySection';
export type { PropertySectionProps } from './PropertySection';

export { getModuleIcon, MODULE_ICONS } from './moduleIcons';
export type { ModuleIconConfig } from './moduleIcons';

export * from './propertyValidation';

// Module-specific property components
export { CampsiteProperties } from './CampsiteProperties';
export type { CampsitePropertiesProps } from './CampsiteProperties';

export { BuildingProperties } from './BuildingProperties';
export type { BuildingPropertiesProps } from './BuildingProperties';

export { RoadProperties } from './RoadProperties';
export type { RoadPropertiesProps } from './RoadProperties';

export { CustomProperties } from './CustomProperties';
export type { CustomPropertiesProps } from './CustomProperties';
