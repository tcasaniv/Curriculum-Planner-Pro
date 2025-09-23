import React, { useState, useRef, useEffect } from 'react';
import type { Theme, ViewTab, HighlightMode, InteractionMode, ViewMode } from '../types';
import { HIGHLIGHT_MODES } from '../constants';

interface MenuBarProps {
  onNew: () => void;
  onImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onExport: () => void;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  isLeftPanelVisible: boolean;
  isRightPanelVisible: boolean;
  onShowGuide: () => void;
  onShowAbout: () => void;
  projectName: string;
  onProjectNameChange: (name: string) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  // Flowchart props
  activeViewTab: ViewTab;
  highlightMode: HighlightMode;
  onHighlightModeChange: (mode: HighlightMode) => void;
  isLayoutOptimized: boolean;
  onIsLayoutOptimizedChange: (checked: boolean) => void;
  isSpacedLayout: boolean;
  onIsSpacedLayoutChange: (checked: boolean) => void;
  isOrthogonalRouting: boolean;
  onIsOrthogonalRoutingChange: (checked: boolean) => void;
  isLegendVisible: boolean;
  onIsLegendVisibleChange: (checked: boolean) => void;
  interactionMode: InteractionMode;
  onInteractionModeChange: (mode: InteractionMode) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  isLayoutDisabled: boolean;
}

const SubMenuItem: React.FC<{label: string, disabled?: boolean, children: React.ReactNode}> = ({ label, disabled, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative" onMouseEnter={() => !disabled && setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
            <a href="#" className={`flex justify-between items-center px-4 py-2 text-sm ${disabled ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'}`} onClick={e => e.preventDefault()}>
                <span>{label}</span>
                <span className="text-xs">▶</span>
            </a>
            {isOpen && (
                 <div className="origin-top-left absolute left-full -top-1 mt-0 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1" role="menu">
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

const MenuBar: React.FC<MenuBarProps> = ({ 
    onNew, onImport, onExport, 
    onToggleLeftPanel, onToggleRightPanel, 
    isLeftPanelVisible, isRightPanelVisible, 
    onShowGuide, onShowAbout,
    projectName, onProjectNameChange,
    theme, onThemeChange,
    activeViewTab,
    highlightMode, onHighlightModeChange,
    isLayoutOptimized, onIsLayoutOptimizedChange,
    isSpacedLayout, onIsSpacedLayoutChange,
    isOrthogonalRouting, onIsOrthogonalRoutingChange,
    isLegendVisible, onIsLegendVisibleChange,
    interactionMode, onInteractionModeChange,
    viewMode, onViewModeChange,
    isLayoutDisabled
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
    setOpenMenu(null);
  };

  const menuItems: Record<string, any[]> = {
    Archivo: [
      { label: 'Nuevo', action: onNew },
      { label: 'Importar JSON...', action: handleImportClick },
      { label: 'Exportar JSON', action: onExport },
    ],
    ...(activeViewTab === 'flowchart' && {
      Vista: [
        { type: 'submenu', label: 'Trazado Automático', disabled: isLayoutDisabled, items: [
            { label: 'Optimizar Trazado', type: 'checkbox', active: isLayoutOptimized, action: () => onIsLayoutOptimizedChange(!isLayoutOptimized), disabled: isLayoutDisabled },
            { label: 'Aumentar Espaciado', type: 'checkbox', active: isSpacedLayout, action: () => onIsSpacedLayoutChange(!isSpacedLayout), disabled: isLayoutDisabled },
            { label: 'Evitar Cruces de Líneas', type: 'checkbox', active: isOrthogonalRouting, action: () => onIsOrthogonalRoutingChange(!isOrthogonalRouting), disabled: isLayoutDisabled },
        ]},
        { type: 'submenu', label: 'Modo de Visualización', items: [
            { label: 'Semestral', type: 'radio', active: viewMode === 'semester', action: () => onViewModeChange('semester') },
            { label: 'Flujo Horizontal', type: 'radio', active: viewMode === 'horizontal', action: () => onViewModeChange('horizontal') },
        ]},
        { type: 'submenu', label: 'Modo de Interacción', items: [
            { label: 'Navegación', type: 'radio', active: interactionMode === 'navigate', action: () => onInteractionModeChange('navigate') },
            { label: 'Mover en Grilla', type: 'radio', active: interactionMode === 'grid', action: () => onInteractionModeChange('grid') },
            { label: 'Movimiento Libre', type: 'radio', active: interactionMode === 'free', action: () => onInteractionModeChange('free') },
        ]},
        { type: 'submenu', label: 'Resaltar por', items: HIGHLIGHT_MODES.map(mode => ({
            label: mode.label, type: 'radio', active: highlightMode === mode.value, action: () => onHighlightModeChange(mode.value)
        }))},
        { type: 'divider' },
        { label: 'Mostrar Leyenda', type: 'checkbox', active: isLegendVisible, action: () => onIsLegendVisibleChange(!isLegendVisible) },
      ]
    }),
    General: [
      { label: `${isLeftPanelVisible ? 'Ocultar' : 'Mostrar'} Plan de Estudios`, action: onToggleLeftPanel },
      { label: `${isRightPanelVisible ? 'Ocultar' : 'Mostrar'} Vistas`, action: onToggleRightPanel },
      { type: 'divider' },
      { type: 'header', label: 'Tema' },
      { label: 'Claro', action: () => onThemeChange('light'), active: theme === 'light', type: 'radio' },
      { label: 'Oscuro', action: () => onThemeChange('dark'), active: theme === 'dark', type: 'radio' },
      { label: 'Sistema', action: () => onThemeChange('system'), active: theme === 'system', type: 'radio' },
    ],
    Ayuda: [
        { label: 'Guía Rápida', action: onShowGuide },
        { label: 'Acerca de...', action: onShowAbout }
    ],
  };

  const createActionHandler = (action?: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    if(action) action();
    setOpenMenu(null);
  };
  
  const renderSubMenuItems = (items: any[]) => {
      return items.map(subItem => (
        <a
            key={subItem.label}
            href="#"
            onClick={createActionHandler(subItem.action)}
            className={`block px-4 py-2 text-sm ${subItem.disabled ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed' : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600'}`}
            role="menuitem"
        >
            <span className="inline-block w-4 mr-2">{subItem.active && (subItem.type === 'checkbox' ? '✓' : '•')}</span>
            {subItem.label}
        </a>
      ));
  }

  return (
    <nav ref={menuRef} className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white flex items-center px-4 h-12 shadow-lg select-none z-30 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center mr-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-3">
            <path d="M9 20L3 17V7L9 4L15 7L21 4V14L15 17L9 20Z" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M3 7L9 4L15 7" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M9 20V4" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
            <path d="M15 17V7" stroke="#c7d2fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
        </svg>
        <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            className="bg-transparent border-b border-gray-400 dark:border-gray-700 hover:border-gray-600 dark:hover:border-gray-500 focus:border-indigo-500 focus:outline-none p-1 text-base font-semibold w-60"
            aria-label="Project Name"
        />
      </div>
      <div className="flex space-x-2">
        {Object.entries(menuItems).map(([menuTitle, items]) => (
          <div key={menuTitle} className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === menuTitle ? null : menuTitle)}
              className="px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-indigo-500"
            >
              {menuTitle}
            </button>
            {openMenu === menuTitle && (
              <div className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 z-50">
                <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                  {items.map((item, index) => {
                    if (item.type === 'divider') return <hr key={index} className="my-1 border-gray-200 dark:border-gray-600" />;
                    if (item.type === 'header') return <div key={index} className="px-4 py-2 text-xs font-bold uppercase text-gray-500 dark:text-gray-400">{item.label}</div>;
                    if (item.type === 'submenu') {
                        return (
                            <SubMenuItem key={item.label} label={item.label} disabled={item.disabled}>
                                {renderSubMenuItems(item.items)}
                            </SubMenuItem>
                        );
                    }

                    return (
                        <a
                        key={item.label}
                        href="#"
                        onClick={createActionHandler(item.action)}
                        className="block px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                        role="menuitem"
                        >
                        <span className="inline-block w-4 mr-2">{item.active && (item.type === 'radio' ? '•' : '✓')}</span>
                        {item.label}
                        </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
        <input type="file" ref={fileInputRef} onChange={onImport} className="hidden" accept=".json" />
      </div>
    </nav>
  );
};

export default MenuBar;
