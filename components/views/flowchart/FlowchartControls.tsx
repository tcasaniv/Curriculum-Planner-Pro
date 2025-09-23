import React from 'react';
import type { HighlightMode } from '../../../types';
import { HIGHLIGHT_MODES } from '../../../constants';

interface FlowchartControlsProps {
    isLayoutOptimized: boolean;
    onLayoutOptimizedChange: (checked: boolean) => void;
    isSpacedLayout: boolean;
    onSpacedLayoutChange: (checked: boolean) => void;
    isOrthogonalRouting: boolean;
    onOrthogonalRoutingChange: (checked: boolean) => void;
    isFreeDragMode: boolean;
    onFreeDragModeChange: (checked: boolean) => void;
    isGridSnapMode: boolean;
    onGridSnapModeChange: (checked: boolean) => void;
    isHorizontalFlowMode: boolean;
    onIsHorizontalFlowModeChange: (checked: boolean) => void;
    highlightMode: HighlightMode;
    onHighlightModeChange: (mode: HighlightMode) => void;
    isLegendVisible: boolean;
    onLegendVisibleChange: (checked: boolean) => void;
}

const Toggle: React.FC<{id: string, label: string, checked: boolean, onChange: (checked: boolean) => void, disabled?: boolean}> = 
({ id, label, checked, onChange, disabled = false }) => (
    <label htmlFor={id} className={`flex items-center select-none ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
        <span className="mr-3 text-sm font-medium text-gray-800 dark:text-gray-200">{label}</span>
        <div className="relative">
            <input 
                type="checkbox" 
                id={id}
                className="sr-only" 
                checked={checked} 
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
            />
            <div className={`block w-10 h-6 rounded-full ${disabled ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
            <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${checked && !disabled ? 'transform translate-x-full bg-indigo-500' : ''} ${disabled && checked ? 'bg-gray-400 dark:bg-gray-500' : ''}`}></div>
        </div>
    </label>
);


const FlowchartControls: React.FC<FlowchartControlsProps> = ({
    isLayoutOptimized, onLayoutOptimizedChange,
    isSpacedLayout, onSpacedLayoutChange,
    isOrthogonalRouting, onOrthogonalRoutingChange,
    isFreeDragMode, onFreeDragModeChange,
    isGridSnapMode, onGridSnapModeChange,
    isHorizontalFlowMode, onIsHorizontalFlowModeChange,
    highlightMode, onHighlightModeChange,
    isLegendVisible, onLegendVisibleChange
}) => {
    const isSpecialViewActive = isFreeDragMode || isGridSnapMode || isHorizontalFlowMode;

    return (
        <div className="p-2 bg-white dark:bg-gray-800 flex items-center justify-between z-10 shadow-md flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
                <Toggle
                    id="horizontal-flow-toggle"
                    label="Vista de Flujo"
                    checked={isHorizontalFlowMode}
                    onChange={onIsHorizontalFlowModeChange}
                />
                <span className="h-6 w-px bg-gray-300 dark:bg-gray-600" aria-hidden="true"></span>
                <Toggle
                    id="layout-toggle"
                    label="Optimizar Trazado"
                    checked={isLayoutOptimized}
                    onChange={onLayoutOptimizedChange}
                    disabled={isSpecialViewActive}
                />
                <Toggle
                    id="spacing-toggle"
                    label="Aumentar Espaciado"
                    checked={isSpacedLayout}
                    onChange={onSpacedLayoutChange}
                    disabled={isSpecialViewActive}
                />
                 <Toggle
                    id="orthogonal-toggle"
                    label="Evitar Cruces"
                    checked={isOrthogonalRouting}
                    onChange={onOrthogonalRoutingChange}
                    disabled={isSpecialViewActive}
                />
                 <span className="h-6 w-px bg-gray-300 dark:bg-gray-600" aria-hidden="true"></span>
                <Toggle
                    id="grid-snap-toggle"
                    label="Mover en Grilla"
                    checked={isGridSnapMode}
                    onChange={onGridSnapModeChange}
                />
                <Toggle
                    id="drag-toggle"
                    label="Modo Libre"
                    checked={isFreeDragMode}
                    onChange={onFreeDragModeChange}
                />
            </div>
            <div className="flex items-center gap-4 flex-wrap">
                <Toggle
                    id="legend-toggle"
                    label="Leyenda"
                    checked={isLegendVisible}
                    onChange={onLegendVisibleChange}
                />
                <span className="h-6 w-px bg-gray-300 dark:bg-gray-600" aria-hidden="true" />
                <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm">Resaltar por:</span>
                    <select value={highlightMode} onChange={e => onHighlightModeChange(e.target.value as HighlightMode)} className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-sm border border-gray-300 dark:border-gray-600 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
                        {HIGHLIGHT_MODES.map(mode => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default FlowchartControls;