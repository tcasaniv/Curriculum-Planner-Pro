import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Course } from '../types';
import { TrashIcon, FilterIcon, SortIcon } from './common/Icons';

type SortKey = 'id' | 'name' | 'semester' | 'credits';

interface LeftPanelProps {
  courses: Course[];
  onAddCourse: () => void;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (courseId: string) => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({ courses, onAddCourse, onEditCourse, onDeleteCourse }) => {
  // #region Table State
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'semester', direction: 'ascending' });
  const [filters, setFilters] = useState<Record<string, Set<string>>>({});
  const [openFilterDropdown, setOpenFilterDropdown] = useState<SortKey | null>(null);
  const [tempFilterSelection, setTempFilterSelection] = useState<Set<string>>(new Set());
  const [filterSearch, setFilterSearch] = useState('');
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  // #endregion
  
  // #region Table Logic
  const columns: { key: SortKey; header: string; }[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Nombre' },
    { key: 'semester', header: 'Sem' },
    { key: 'credits', header: 'Cred' },
  ];

  const getCourseValue = (course: Course, key: SortKey): any => course[key];

  const uniqueColumnValues = useMemo(() => {
    const uniqueValues: Record<string, Set<string>> = {};
    columns.forEach(({ key }) => {
        const values = new Set<string>();
        courses.forEach(course => {
            values.add(String(getCourseValue(course, key as SortKey)));
        });
        uniqueValues[key] = values;
    });
    return uniqueValues;
  }, [courses]);

  const handleOpenFilter = (key: SortKey) => {
    setTempFilterSelection(new Set(filters[key] || []));
    setFilterSearch('');
    setOpenFilterDropdown(key);
  };

  const handleApplyFilter = () => {
    if (!openFilterDropdown) return;
    const newFilters = { ...filters };
    const columnUniqueValues = uniqueColumnValues[openFilterDropdown];
    // FIX: Add guard for columnUniqueValues
    if (columnUniqueValues && tempFilterSelection.size > 0 && tempFilterSelection.size < columnUniqueValues.size) {
        newFilters[openFilterDropdown] = tempFilterSelection;
    } else {
        delete newFilters[openFilterDropdown];
    }
    setFilters(newFilters);
    setOpenFilterDropdown(null);
  };
  
  const handleCancelFilter = () => setOpenFilterDropdown(null);

  const handleTempSelectionChange = (value: string, isChecked: boolean) => {
    setTempFilterSelection(prev => {
        const newSet = new Set(prev);
        if (isChecked) newSet.add(value);
        else newSet.delete(value);
        return newSet;
    });
  };

  const currentFilterOptions = useMemo(() => {
    if (!openFilterDropdown) return [];
    const options = Array.from(uniqueColumnValues[openFilterDropdown] || []);
    // FIX: Cast to string before calling localeCompare to fix 'unknown' type error.
    const sortedOptions = options.sort((a,b) => String(a).localeCompare(String(b), undefined, {numeric: true}));
    if (!filterSearch) return sortedOptions;
    // FIX: Cast to string before calling toLowerCase to fix 'unknown' type error.
    return sortedOptions.filter(opt => String(opt).toLowerCase().includes(filterSearch.toLowerCase()));
  }, [openFilterDropdown, filterSearch, uniqueColumnValues]);

  const handleSelectAll = () => setTempFilterSelection(new Set(currentFilterOptions));
  const handleClearAll = () => setTempFilterSelection(new Set());

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
            handleCancelFilter();
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredAndSortedCourses = useMemo(() => {
    let processedCourses = [...courses];
    
    const activeFilters = Object.entries(filters).filter(([, value]) => value && value.size > 0);
    if (activeFilters.length > 0) {
        processedCourses = processedCourses.filter(course => {
            return activeFilters.every(([key, selectedValues]) => {
                const courseValue = getCourseValue(course, key as SortKey);
                // FIX: Cast selectedValues to Set<string> to fix 'unknown' type error on .has
                return (selectedValues as Set<string>).has(String(courseValue));
            });
        });
    }

    if (searchTerm) {
        const lowercasedFilter = searchTerm.toLowerCase();
        processedCourses = processedCourses.filter(course => 
            columns.some(({ key }) => 
                String(getCourseValue(course, key)).toLowerCase().includes(lowercasedFilter)
            )
        );
    }
    
    processedCourses.sort((a, b) => {
        const aValue = getCourseValue(a, sortConfig.key);
        const bValue = getCourseValue(b, sortConfig.key);
        if (a.id === b.id) return 0; // Fallback for stability

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            const diff = sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
            return diff !== 0 ? diff : a.id.localeCompare(b.id);
        }
        
        const compareResult = String(aValue).localeCompare(String(bValue));
        const directionMultiplier = sortConfig.direction === 'ascending' ? 1 : -1;
        
        return compareResult !== 0 ? compareResult * directionMultiplier : a.id.localeCompare(b.id);
    });
    
    return processedCourses;
  }, [courses, searchTerm, filters, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  // #endregion

  return (
    <div className="bg-gray-100 dark:bg-gray-800 h-full flex flex-col p-4 overflow-hidden border-r border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">Plan de Estudios</h2>
        <button onClick={onAddCourse} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded">
          Añadir Asignatura
        </button>
      </div>
      <input
          type="text"
          placeholder="Buscar asignatura..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full p-2 mb-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 shrink-0"
          aria-label="Buscar en la tabla de asignaturas"
      />
      <div className="flex-grow overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
            <tr>
              {columns.map(({ key, header }) => (
                <th key={key} scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <button onClick={() => requestSort(key)} className="flex items-center space-x-1 w-full hover:text-gray-900 dark:hover:text-white transition-colors">
                    <span>{header}</span>
                    <SortIcon direction={sortConfig.key === key ? sortConfig.direction : 'none'} />
                  </button>
                </th>
              ))}
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider" rowSpan={2}>Acciones</th>
            </tr>
            <tr>
              {columns.map(({ key }) => (
                <th key={`${key}-filter`} className="px-2 py-1 align-top bg-gray-100 dark:bg-gray-800 relative">
                    <button
                        aria-label={`Filtrar por ${key}`}
                        onClick={() => handleOpenFilter(key)}
                        className={`p-1 rounded w-full flex justify-center ${filters[key]?.size > 0 ? 'text-indigo-500 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    >
                        <FilterIcon />
                    </button>
                    {openFilterDropdown === key && (
                        <div ref={filterDropdownRef} className="absolute z-20 top-full left-0 mt-1 w-64 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl text-left font-normal normal-case">
                           <div className="p-2 border-b border-gray-200 dark:border-gray-600">
                                <input type="text" placeholder="Buscar valores..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} className="w-full p-1 text-xs bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
                            </div>
                            <div className="text-xs p-2 flex justify-between">
                                <button onClick={handleSelectAll} className="hover:text-indigo-500 dark:hover:text-indigo-400">Seleccionar todo</button>
                                <button onClick={handleClearAll} className="hover:text-indigo-500 dark:hover:text-indigo-400">Limpiar</button>
                            </div>
                            <div className="p-2 max-h-48 overflow-y-auto border-t border-gray-200 dark:border-gray-600 text-sm">
                                {currentFilterOptions.map(option => (
                                    <label key={option} className="flex items-center space-x-2 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer">
                                        <input type="checkbox" checked={tempFilterSelection.has(option)} onChange={e => handleTempSelectionChange(option, e.target.checked)} className="form-checkbox bg-gray-200 dark:bg-gray-800 border-gray-400 dark:border-gray-600 text-indigo-500 focus:ring-indigo-500 h-3.5 w-3.5" />
                                        <span>{option}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="p-2 flex justify-end space-x-2 bg-gray-100 dark:bg-gray-800 rounded-b-lg">
                                <button onClick={handleCancelFilter} className="px-3 py-1 text-xs rounded bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500">Cancelar</button>
                                <button onClick={handleApplyFilter} className="px-3 py-1 text-xs rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold">Aplicar</button>
                            </div>
                        </div>
                    )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedCourses.map(course => (
              <tr key={course.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{course.id}</td>
                <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900 dark:text-white">{course.name}</td>
                <td className="px-2 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{course.semester}</td>
                <td className="px-2 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">{course.credits}</td>
                <td className="px-4 py-3 whitespace-nowrap font-medium">
                  <div className="flex items-center space-x-3">
                    <button onClick={() => onEditCourse(course)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300">Editar</button>
                    <button onClick={() => onDeleteCourse(course.id)} className="text-red-600 dark:text-red-500 hover:text-red-800 dark:hover:text-red-400">
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeftPanel;