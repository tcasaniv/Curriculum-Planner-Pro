import React from 'react';
import type { Course, ViewTab, HighlightMode, InteractionMode, ViewMode } from '../types';
import CurriculumFlowchart from './views/CurriculumFlowchart';
import SyllabusView from './views/SyllabusView';
import StatisticsView from './views/StatisticsView';
import CourseTableView from './views/CourseTableView';

interface RightPanelProps {
  courses: Course[];
  onEditCourse: (course: Course) => void;
  activeTab: ViewTab;
  onTabChange: (tab: ViewTab) => void;
  // Flowchart props
  highlightMode: HighlightMode;
  isLayoutOptimized: boolean;
  isSpacedLayout: boolean;
  isOrthogonalRouting: boolean;
  isLegendVisible: boolean;
  interactionMode: InteractionMode;
  viewMode: ViewMode;
}

const RightPanel: React.FC<RightPanelProps> = ({ 
    courses, onEditCourse, activeTab, onTabChange,
    highlightMode, isLayoutOptimized, isSpacedLayout, isOrthogonalRouting,
    isLegendVisible, interactionMode, viewMode
}) => {

  const renderContent = () => {
    switch (activeTab) {
      case 'flowchart':
        return <CurriculumFlowchart 
                    courses={courses} 
                    onEditCourse={onEditCourse}
                    highlightMode={highlightMode}
                    isLayoutOptimized={isLayoutOptimized}
                    isSpacedLayout={isSpacedLayout}
                    isOrthogonalRouting={isOrthogonalRouting}
                    isLegendVisible={isLegendVisible}
                    interactionMode={interactionMode}
                    viewMode={viewMode}
                />;
      case 'syllabus':
        return <SyllabusView courses={courses} />;
      case 'statistics':
        return <StatisticsView courses={courses} />;
      case 'courseTable':
        return <CourseTableView courses={courses} />;
      default:
        return null;
    }
  };

  const tabs: { id: ViewTab; label: string }[] = [
    { id: 'flowchart', label: 'Malla Curricular' },
    { id: 'syllabus', label: 'Sumillas' },
    { id: 'statistics', label: 'Estadísticas' },
    { id: 'courseTable', label: 'Tabla de Cursos' },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 h-full flex flex-col">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4 px-4" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500'
              } whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="flex-grow overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default RightPanel;
