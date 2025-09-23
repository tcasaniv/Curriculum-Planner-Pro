import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Course } from '../../types';
import { COMPONENT_NAMES, EVALUATION_TYPE_NAMES, COURSE_TYPE_NAMES } from '../../constants';
import { FilterIcon, SortIcon } from '../common/Icons';

type SortKey = keyof Course | 'totalHours' | 'prerequisitesCount';

const CourseTableView: React.FC<{ courses: Course[] }> = ({ courses }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'ascending' | 'descending' }>({ key: 'id', direction: 'ascending' });
    const [filters, setFilters] = useState<Record<string, Set<string>>>({});
    
    const [openFilterDropdown, setOpenFilterDropdown] = useState<SortKey | null>(null);
    const [tempFilterSelection, setTempFilterSelection] = useState<Set<string>>(new Set());
    const [filterSearch, setFilterSearch] = useState('');
    const filterDropdownRef = useRef<HTMLDivElement>(null);

    const columns: { key: SortKey; header: string; }[] = [
        { key: 'id', header: 'ID' },
        { key: 'name', header: 'Nombre' },
        { key: 'semester', header: 'Sem' },
        { key: 'credits', header: 'Cred' },
        { key: 'totalHours', header: 'Horas' },
        { key: 'prerequisitesCount', header: 'Prereqs' },
        { key: 'competencia', header: 'Componente' },
        { key: 'tipoMedicion', header: 'Grupo Eval.' },
        { key: 'tipoAsignatura', header: 'Tipo' },
        { key: 'academicDepartments', header: 'Depto. Académico' },
    ];
    
    const getCourseValue = (course: Course, key: SortKey): any => {
        if (key === 'totalHours') return course.theoryHours + course.practiceHours + course.labHours + course.seminarHours + course.theoryPracticeHours;
        if (key === 'prerequisitesCount') return course.prerequisites.length;
        if (key === 'competencia') return COMPONENT_NAMES[course.competencia];
        if (key === 'tipoMedicion') return EVALUATION_TYPE_NAMES[course.tipoMedicion];
        if (key === 'tipoAsignatura') return COURSE_TYPE_NAMES[course.tipoAsignatura];
        if (key === 'academicDepartments') return course.academicDepartments.join(', ');
        return course[key as keyof Course];
    };
    
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
            if (typeof aValue === 'number' && typeof bValue === 'number') {
                return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
            }
            if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
            return 0;
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
    
    if (!courses.length) {
        return <div className="text-center p-8 text-gray-500 dark:text-gray-400">No hay asignaturas para mostrar.</div>;
    }

    return (
        <div className="p-4 h-full flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <input
                type="text"
                placeholder="Buscar en toda la tabla..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-2 mb-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Buscar en la tabla"
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
                                                <input type="text" placeholder="Buscar valores..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} className="w-full p-1 text-xs bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"/>
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
                                {columns.map(({ key }) => (
                                     <td key={key} className="px-3 py-3 whitespace-nowrap align-top">
                                        {String(getCourseValue(course, key))}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CourseTableView;