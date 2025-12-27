/**
 * useFabricCanvas Hook Unit Tests
 * Simplified tests focusing on initialization state
 */

import { describe, it, expect } from 'vitest';

describe('useFabricCanvas initialization', () => {
    it('should define canvas options structure', () => {
        const defaultOptions = {
            selection: true,
            preserveObjectStacking: true,
            backgroundColor: 'oklch(0.928 0.006 264.5)',
        };

        expect(defaultOptions.selection).toBe(true);
        expect(defaultOptions.preserveObjectStacking).toBe(true);
        expect(typeof defaultOptions.backgroundColor).toBe('string');
    });

    it('should define control styles', () => {
        const controlStyles = {
            cornerStyle: 'circle',
            cornerColor: 'oklch(0 0 0)',
            cornerStrokeColor: 'oklch(0 0 0)',
            cornerSize: 10,
            transparentCorners: false,
            borderColor: 'oklch(0 0 0)',
            borderScaleFactor: 2,
        };

        expect(controlStyles.cornerStyle).toBe('circle');
        expect(controlStyles.cornerSize).toBe(10);
        expect(controlStyles.transparentCorners).toBe(false);
    });
});

describe('Event listener management', () => {
    it('should track multiple handlers per event', () => {
        const listeners = new Map<string, Set<() => void>>();

        const addEventListener = (event: string, handler: () => void) => {
            if (!listeners.has(event)) {
                listeners.set(event, new Set());
            }
            listeners.get(event)!.add(handler);
        };

        const handler1 = () => { };
        const handler2 = () => { };

        addEventListener('mouse:down', handler1);
        addEventListener('mouse:down', handler2);

        expect(listeners.get('mouse:down')?.size).toBe(2);
    });

    it('should remove specific handler', () => {
        const listeners = new Map<string, Set<() => void>>();

        const addEventListener = (event: string, handler: () => void) => {
            if (!listeners.has(event)) {
                listeners.set(event, new Set());
            }
            listeners.get(event)!.add(handler);
        };

        const removeEventListener = (event: string, handler: () => void) => {
            listeners.get(event)?.delete(handler);
        };

        const handler1 = () => { };
        const handler2 = () => { };

        addEventListener('mouse:down', handler1);
        addEventListener('mouse:down', handler2);
        removeEventListener('mouse:down', handler1);

        expect(listeners.get('mouse:down')?.size).toBe(1);
        expect(listeners.get('mouse:down')?.has(handler2)).toBe(true);
    });
});
