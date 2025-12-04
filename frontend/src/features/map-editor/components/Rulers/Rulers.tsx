/**
 * Rulers Component
 * Wrapper for ruler components that integrates with the new map editor
 */

import React, { useState, useEffect } from 'react';
import RulerComponent from '@/components/RulerComponent';
import { useEditorService } from '../../hooks/useEditorService';
import { useViewportService } from '../../hooks/useViewportService';
import { useMapEditor } from '../../hooks/useMapEditor';

interface RulersProps {
  containerSize: { width: number; height: number };
}

export const Rulers: React.FC<RulersProps> = ({ containerSize }) => {
  const editorService = useEditorService();
  const viewportService = useViewportService();
  const { eventBus } = useMapEditor();
  const [showRulers, setShowRulers] = React.useState(editorService.areRulersVisible());
  const [viewport, setViewport] = React.useState(viewportService.getViewport());

  // Sync with editor service state
  React.useEffect(() => {
    setShowRulers(editorService.areRulersVisible());
  }, [editorService]);

  // Listen to ruler toggle events
  React.useEffect(() => {
    const unsubscribe = eventBus.on('ruler:toggle', (payload) => {
      setShowRulers(payload.enabled);
    });
    return unsubscribe;
  }, [eventBus]);

  // Listen to viewport changes
  React.useEffect(() => {
    const unsubscribe = eventBus.on('viewport:change', (payload) => {
      setViewport({ zoom: payload.zoom, position: payload.position });
    });
    return unsubscribe;
  }, [eventBus]);

  if (!showRulers || containerSize.width === 0 || containerSize.height === 0) {
    return null;
  }

  const rulerSize = 24;

  return (
    <>
      <RulerComponent
        orientation="horizontal"
        length={containerSize.width - rulerSize}
        zoom={viewport.zoom}
        offset={viewport.position.x + rulerSize}
      />
      <RulerComponent
        orientation="vertical"
        length={containerSize.height - rulerSize}
        zoom={viewport.zoom}
        offset={viewport.position.y + rulerSize}
      />
    </>
  );
};

