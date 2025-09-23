import React, { useMemo } from 'react';
import type { Course, HighlightMode } from '../../../types';
import { 
    COMPONENT_COLORS, COMPONENT_NAMES, 
    EVALUATION_TYPE_COLORS, EVALUATION_TYPE_NAMES, 
    COURSE_TYPE_COLORS, COURSE_TYPE_NAMES 
} from '../../../constants';
import { EyeIcon, EyeOffIcon } from '../../common/Icons';

interface LegendItem {
    name: string;
    color: string;
    credits: number;
}

interface FlowchartLegendProps {
  highlightMode: HighlightMode;
  courses: Course[];
  departmentColors: Record<string, string>;
  areaColors: Record<string, string>;
  onHoverCategory: (category: string | null) => void;
  onToggleCategory: (category: string) => void;
  hiddenCategories: Set<string>;
}

const FlowchartLegend: React.FC<FlowchartLegendProps> = ({ 
    highlightMode, courses, departmentColors, areaColors,
    onHoverCategory, onToggleCategory, hiddenCategories
}) => {
    
    const legendData = useMemo(() => {
        const creditMap: Map<string, number> = new Map();
        
        const getCategory = (course: Course): string => {
            switch (highlightMode) {
                case 'component': return course.competencia;
                case 'evaluation': return course.tipoMedicion;
                case 'type': return course.tipoAsignatura;
                case 'department': return course.academicDepartments.length > 0 ? course.academicDepartments[0] : 'Sin Depto.';
                case 'area': return course.areaAcademica || 'Sin Área';
                default: return 'N/A';
            }
        };

        courses.forEach(course => {
            const category = getCategory(course);
            creditMap.set(category, (creditMap.get(category) || 0) + course.credits);
        });

        let items: LegendItem[] = [];
        let title = '';

        switch(highlightMode) {
            case 'component':
                title = 'Componente';
                items = Object.entries(COMPONENT_NAMES).map(([key, name]) => ({
                    name,
                    color: COMPONENT_COLORS[key as keyof typeof COMPONENT_COLORS],
                    credits: creditMap.get(key) || 0,
                }));
                break;
            case 'evaluation':
                title = 'Grupo Evaluativo';
                items = Object.entries(EVALUATION_TYPE_NAMES).map(([key, name]) => ({
                    name,
                    color: EVALUATION_TYPE_COLORS[key as keyof typeof EVALUATION_TYPE_COLORS],
                    credits: creditMap.get(key) || 0,
                }));
                break;
            case 'type':
                title = 'Tipo de Asignatura';
                items = Object.entries(COURSE_TYPE_NAMES).map(([key, name]) => ({
                    name,
                    color: COURSE_TYPE_COLORS[key as keyof typeof COURSE_TYPE_COLORS],
                    credits: creditMap.get(key) || 0,
                }));
                break;
            case 'department':
                title = 'Departamento Académico';
                items = Array.from(creditMap.entries()).map(([dept, credits]) => ({
                    name: dept,
                    color: departmentColors[dept] || 'fill-gray-600',
                    credits,
                }));
                break;
             case 'area':
                title = 'Sección Académica';
                items = Array.from(creditMap.entries()).map(([area, credits]) => ({
                    name: area,
                    color: areaColors[area] || 'fill-gray-600',
                    credits,
                }));
                break;
        }

        items = items.filter(item => item.credits > 0);
        items.sort((a,b) => b.credits - a.credits);

        const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);

        return { title, items, totalCredits };

    }, [highlightMode, courses, departmentColors, areaColors]);
    
    if (legendData.items.length === 0 && courses.length > 0) {
        return (
             <div className="text-gray-500 dark:text-gray-400 text-center p-4">
                 No hay datos para esta vista de leyenda.
             </div>
        );
    }
    
    return (
        <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 sticky top-0 bg-white dark:bg-gray-800 py-2 -mt-4 -mx-4 px-4 shadow-sm">Leyenda y Resumen</h3>
            <div className="space-y-3">
                <h4 className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-2">{legendData.title}</h4>
                <ul className="space-y-1 text-sm">
                    {legendData.items.map(item => {
                        const isHidden = hiddenCategories.has(item.name);
                        return (
                            <li 
                                key={item.name} 
                                className={`flex items-center justify-between p-1 rounded-md cursor-pointer transition-all ${isHidden ? 'opacity-60 bg-gray-100 dark:bg-gray-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                onMouseEnter={() => !isHidden && onHoverCategory(item.name)}
                                onMouseLeave={() => onHoverCategory(null)}
                                onClick={() => onToggleCategory(item.name)}
                            >
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className={`w-4 h-4 rounded-sm shrink-0 ${item.color.replace('fill-', 'bg-')}`}></span>
                                    <span className="text-gray-700 dark:text-gray-300 break-words truncate">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="font-mono text-gray-500 dark:text-gray-400 ml-2">{item.credits} cr.</span>
                                    <span className="text-gray-400 dark:text-gray-500 w-4">
                                        {isHidden ? <EyeOffIcon /> : <EyeIcon />}
                                    </span>
                                </div>
                            </li>
                        );
                    })}
                </ul>
                <hr className="my-4 border-gray-200 dark:border-gray-600" />
                <div className="flex justify-between items-center font-bold">
                    <span className="text-gray-900 dark:text-white">Total de Créditos</span>
                    <span className="font-mono text-indigo-600 dark:text-indigo-400">{legendData.totalCredits} cr.</span>
                </div>
            </div>
        </div>
    );
};

export default FlowchartLegend;