import React, { useState, useRef, useEffect } from 'react';
import type { Theme } from '../types';

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
}

const MenuBar: React.FC<MenuBarProps> = ({ 
    onNew, onImport, onExport, 
    onToggleLeftPanel, onToggleRightPanel, 
    isLeftPanelVisible, isRightPanelVisible, 
    onShowGuide, onShowAbout,
    projectName, onProjectNameChange,
    theme, onThemeChange
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
    Ver: [
      { label: `${isLeftPanelVisible ? 'Ocultar' : 'Mostrar'} Plan de Estudios`, action: onToggleLeftPanel },
      { label: `${isRightPanelVisible ? 'Ocultar' : 'Mostrar'} Vistas`, action: onToggleRightPanel },
      { type: 'divider' },
      { type: 'header', label: 'Tema' },
      { label: 'Claro', action: () => onThemeChange('light'), active: theme === 'light' },
      { label: 'Oscuro', action: () => onThemeChange('dark'), active: theme === 'dark' },
      { label: 'Sistema', action: () => onThemeChange('system'), active: theme === 'system' },
    ],
    Ayuda: [
        { label: 'Guía Rápida', action: onShowGuide },
        { label: 'Acerca de...', action: onShowAbout }
    ],
  };

  return (
    <nav ref={menuRef} className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white flex items-center px-4 h-12 shadow-lg select-none z-20 border-b border-gray-200 dark:border-gray-700">
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

                    return (
                        <a
                        key={item.label}
                        href="#"
                        onClick={(e) => { e.preventDefault(); item.action(); setOpenMenu(null); }}
                        className="block px-4 py-2 text-sm text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                        role="menuitem"
                        >
                        <span className="inline-block w-4 mr-2">{item.active && '✓'}</span>
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