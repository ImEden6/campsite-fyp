/**
 * Fabric runtime
 *
 * The one place the map editor touches Fabric's own constructors.
 *
 * The editor describes Fabric objects with its own structural types (types/fabricTypes), which
 * deliberately don't match Fabric v6's class types exactly. This file is the typed seam between
 * the two: it lists only the Fabric APIs the editor actually uses, and what they produce in
 * the editor's types, so the rest of the code never needs to cast or fall back to `any`.
 */

import * as fabricImpl from 'fabric';
import type {
    FabricCanvas,
    FabricControl,
    FabricGroup,
    FabricImage,
    FabricLine,
    FabricObject,
} from '@/types/fabricTypes';

type Constructor<T> = new (...args: unknown[]) => T;

export interface FabricRuntime {
    Canvas: Constructor<FabricCanvas>;
    Rect: Constructor<FabricObject>;
    Circle: Constructor<FabricObject>;
    Line: Constructor<FabricLine>;
    Path: Constructor<FabricObject>;
    Polyline: Constructor<FabricObject>;
    /** Fabric always gives a group its standard set of handles. */
    Group: Constructor<FabricGroup & { controls: Record<string, FabricControl> }>;
    ActiveSelection: Constructor<FabricObject>;
    Shadow: Constructor<unknown>;
    Control: Constructor<FabricControl>;
    /** Only the shared prototype is used, to set the default look of every object's handles. */
    FabricObject: {
        prototype: {
            set(options: Record<string, unknown>): void;
            controls?: Record<string, FabricControl | undefined>;
        };
    };
    util: {
        makeBoundingBoxFromPoints(points: Array<{ x: number; y: number }>): { left: number; top: number; width: number; height: number };
    };
    FabricImage: {
        fromURL(url: string, options?: Record<string, unknown>): Promise<FabricImage>;
    };
}

export const fabric = fabricImpl as unknown as FabricRuntime;
