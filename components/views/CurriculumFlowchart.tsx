import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Course, HighlightMode, InteractionMode, ViewMode } from '../../types';
import { 
    COMPONENT_COLORS, EVALUATION_TYPE_COLORS, COURSE_TYPE_COLORS,
    COMPONENT_NAMES, EVALUATION_TYPE_NAMES, COURSE_TYPE_NAMES 
} from '../../constants';
import CourseDetailsModal from '../common/CourseDetailsModal';
import FlowchartLegend from './flowchart/FlowchartLegend';
import HorizontalFlow from './flowchart/HorizontalFlow';
import SemesterFlow from './flowchart/semester/SemesterFlow';

interface CurriculumFlowchartProps {
  courses: Course[];
  onEditCourse: (course: Course) => void;
  highlightMode: HighlightMode;
  isLayoutOptimized: boolean;
  isSpacedLayout: boolean;
  isOrthogonalRouting: boolean;
  isLegendVisible: boolean;
  interactionMode: InteractionMode;
  viewMode: ViewMode;
}

const CurriculumFlowchart: React.FC<CurriculumFlowchartProps> = ({ 
    courses, onEditCourse,
    highlightMode, isLayoutOptimized, isSpacedLayout, isOrthogonalRouting,
    isLegendVisible, interactionMode, viewMode
}) => {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set());

  const [nodePositions, setNodePositions] = useState<Map<string, {x: number, y: number}>>(new Map());
  const [draggedNode, setDraggedNode] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const uniqueDepartments = useMemo(() => Array.from(new Set(courses.flatMap(c => c.academicDepartments))), [courses]);
  const uniqueAreas = useMemo(() => Array.from(new Set(courses.map(c => c.areaAcademica).filter(Boolean))), [courses]);
  
  const departmentColors = useMemo(() => {
    const colors = ['fill-red-500', 'fill-blue-500', 'fill-green-500', 'fill-yellow-500', 'fill-purple-500', 'fill-pink-500', 'fill-indigo-500', 'fill-gray-500'];
    const colorMap: Record<string, string> = {};
    uniqueDepartments.forEach((dept, i) => {
        colorMap[dept] = colors[i % colors.length];
    });
    return colorMap;
  }, [uniqueDepartments]);
   const areaColors = useMemo(() => {
    const colors = ['fill-red-500', 'fill-blue-500', 'fill-green-500', 'fill-yellow-500', 'fill-purple-500', 'fill-pink-500', 'fill-indigo-500', 'fill-gray-500'];
    const colorMap: Record<string, string> = {};
    uniqueAreas.forEach((area, i) => {
        colorMap[area] = colors[i % colors.length];
    });
    return colorMap;
  }, [uniqueAreas]);

  // Handler for legend click
  const handleToggleCategory = (category: string) => {
    setHiddenCategories(prev => {
        const newSet = new Set(prev);
        if (newSet.has(category)) {
            newSet.delete(category);
        } else {
            newSet.add(category);
        }
        return newSet;
    });
    setHoveredCategory(null); // Clear hover on click
  };
  
  const relatedCourseIds = useMemo(() => {
    if (!hoveredCourseId) return null;

    const hoveredCourse = courses.find(c => c.id === hoveredCourseId);
    if (!hoveredCourse) return null;

    const prereqIds = new Set(hoveredCourse.prerequisites);
    const dependentIds = new Set<string>();
    courses.forEach(c => {
        if (c.prerequisites.includes(hoveredCourseId)) {
            dependentIds.add(c.id);
        }
    });

    return {
        prereqs: prereqIds,
        dependents: dependentIds,
    };
  }, [hoveredCourseId, courses]);
  
  // Helper to get consistent category name
  const getCategoryNameForCourse = (course: Course): string => {
    switch (highlightMode) {
        case 'component': return COMPONENT_NAMES[course.competencia];
        case 'evaluation': return EVALUATION_TYPE_NAMES[course.tipoMedicion];
        case 'type': return COURSE_TYPE_NAMES[course.tipoAsignatura];
        case 'department': return course.academicDepartments.length > 0 ? course.academicDepartments[0] : 'Sin Depto.';
        case 'area': return course.areaAcademica || 'Sin Área';
        default: return 'N/A';
    }
  };

  const autoLayoutData = useMemo(() => {
    if (courses.length === 0) return null;

    // Constants for layout
    const NODE_WIDTH = 160;
    const NODE_HEIGHT = 80;
    const COL_GAP = 60;
    const HEADER_HEIGHT = 80; // Increased for credit summary
    const PADDING = 20;
    const COL_WIDTH = NODE_WIDTH + COL_GAP;
    
    // Row gaps
    const COMPACT_ROW_GAP = 20;
    const WIDE_ROW_GAP = 60; // Fallback for non-optimized spaced layout
    const STRATEGIC_ROW_GAP = 20; // Base gap for strategic mode
    const rowGap = isSpacedLayout ? WIDE_ROW_GAP : COMPACT_ROW_GAP;

    // Group courses by semester
    const semesters = courses.reduce((acc, course) => {
      const sem = course.semester || 1;
      if (!acc[sem]) acc[sem] = [];
      acc[sem].push(course);
      return acc;
    }, {} as Record<number, Course[]>);

    const semesterNumbers = Object.keys(semesters).map(Number).sort((a,b) => a-b);
    const numSemesters = semesterNumbers.length > 0 ? Math.max(...semesterNumbers) : 0;
    
    const semesterCredits: Record<number, number> = {};
    semesterNumbers.forEach(semNum => {
        semesterCredits[semNum] = (semesters[semNum] || []).reduce((sum, course) => sum + course.credits, 0);
    });

    const nodes = new Map<string, { course: Course, x: number, y: number }>();
    
    semesterNumbers.forEach(semNum => {
        const currentSemesterCourses = semesters[semNum];
        let coursesToLayout = [...currentSemesterCourses];

        // 1. Sorting based on optimization toggle
        if (isLayoutOptimized && semNum > 1) {
            coursesToLayout.sort((courseA, courseB) => {
                const getAvgPrereqY = (course: Course) => {
                    if (course.prerequisites.length === 0) return Infinity; // Push courses with no prereqs to the bottom
                    const prereqYs = course.prerequisites
                        .map(prereqId => nodes.get(prereqId)?.y)
                        .filter((y): y is number => y !== undefined)
                        .map(y => y + NODE_HEIGHT / 2); // Use center of prereq node
                    if (prereqYs.length === 0) return Infinity;
                    return prereqYs.reduce((acc, y) => acc + y, 0) / prereqYs.length;
                };

                const avgYA = getAvgPrereqY(courseA);
                const avgYB = getAvgPrereqY(courseB);

                if (avgYA === avgYB) return courseA.casi.localeCompare(courseB.casi);
                if (avgYA === Infinity && avgYB === Infinity) return courseA.casi.localeCompare(courseB.casi);
                return avgYA - avgYB;
            });
        } else {
            coursesToLayout.sort((a,b) => a.casi.localeCompare(b.casi));
        }

        // 2. Placement
        const baseY = PADDING + HEADER_HEIGHT;
        const colIndex = semNum - 1;
        const canDoStrategicLayout = isSpacedLayout && semNum > 1;

        if (canDoStrategicLayout) {
            let nextAvailableRow = 0;
            const rowHeight = NODE_HEIGHT + STRATEGIC_ROW_GAP;
            const rowOccupied = new Set<number>();

            coursesToLayout.forEach(course => {
                const getIdealY = (c: Course): number => {
                    if (c.prerequisites.length === 0) return -1;
                    const prereqYs = c.prerequisites
                        .map(prereqId => nodes.get(prereqId)?.y)
                        .filter((y): y is number => y !== undefined)
                        .map(y => y + NODE_HEIGHT / 2); // Center of prereq node
                    if (prereqYs.length === 0) return -1;
                    return prereqYs.reduce((acc, y) => acc + y, 0) / prereqYs.length;
                };

                const idealY = getIdealY(course);
                let finalRowIndex: number;

                if (idealY !== -1) {
                    const idealNodeCenterY = idealY;
                    const idealNodeTopY = idealNodeCenterY - NODE_HEIGHT / 2;
                    const idealRowCandidate = Math.max(0, Math.round((idealNodeTopY - baseY) / rowHeight));
                    
                    let targetRow = idealRowCandidate;
                    // Simple collision avoidance: find next free slot downwards
                    while(rowOccupied.has(targetRow)) {
                        targetRow++;
                    }
                    finalRowIndex = targetRow;

                } else {
                    // Place at the next available row if no prereqs
                    let targetRow = nextAvailableRow;
                     while(rowOccupied.has(targetRow)) {
                        targetRow++;
                    }
                    finalRowIndex = targetRow;
                    nextAvailableRow = finalRowIndex + 1;
                }
                
                rowOccupied.add(finalRowIndex);

                nodes.set(course.id, {
                    course,
                    x: PADDING + colIndex * COL_WIDTH,
                    y: baseY + finalRowIndex * rowHeight,
                });
            });
        } else { // non-strategic layout
            coursesToLayout.forEach((course, index) => {
                nodes.set(course.id, {
                    course,
                    x: PADDING + colIndex * COL_WIDTH,
                    y: baseY + index * (NODE_HEIGHT + rowGap),
                });
            });
        }
    });

    const allNodes = Array.from(nodes.values());
    const nodeMap = new Map(allNodes.map(n => [n.course.id, n]));
    
    const semesterMaxY = semesterNumbers.map(semNum => {
        const semesterNodes = allNodes.filter(n => n.course.semester === semNum);
        return semesterNodes.length > 0 ? Math.max(...semesterNodes.map(n => n.y)) : 0;
    });

    const totalHeight = PADDING * 2 + HEADER_HEIGHT + Math.max(0, ...semesterMaxY);
    const totalWidth = PADDING * 2 + numSemesters * COL_WIDTH - COL_GAP;

    const edges = courses.flatMap(course => 
        course.prerequisites.map(prereqId => {
            const source = nodeMap.get(prereqId);
            const target = nodeMap.get(course.id);
            if (!source || !target) return null;
            return {
                id: `${prereqId}-${course.id}`,
                sourceId: prereqId,
                targetId: course.id,
                x1: source.x + NODE_WIDTH,
                y1: source.y + NODE_HEIGHT / 2,
                x2: target.x,
                y2: target.y + NODE_HEIGHT / 2,
            };
        }).filter((e): e is NonNullable<typeof e> => e !== null)
    );

    return { nodes: allNodes, edges, width: Math.max(600, totalWidth), height: Math.max(400, totalHeight), numSemesters, COL_WIDTH, PADDING, HEADER_HEIGHT, NODE_WIDTH, NODE_HEIGHT, COL_GAP, semesterCredits };
  }, [courses, isLayoutOptimized, isSpacedLayout]);

    useEffect(() => {
        if (autoLayoutData) {
            const initialPositions = new Map(autoLayoutData.nodes.map(n => [n.course.id, {x: n.x, y: n.y}]));
            setNodePositions(initialPositions);
        }
    }, [autoLayoutData]);

    const finalLayoutData = useMemo(() => {
        if (!autoLayoutData) return null;

        const nodes = autoLayoutData.nodes.map(node => ({
            ...node,
            ...nodePositions.get(node.course.id)
        }));

        const nodeMap = new Map(nodes.map(n => [n.course.id, n]));

        const edges = courses.flatMap(course => 
            course.prerequisites.map(prereqId => {
                const source = nodeMap.get(prereqId);
                const target = nodeMap.get(course.id);
                if (!source || !target) return null;
                return {
                    id: `${prereqId}-${course.id}`,
                    sourceId: prereqId,
                    targetId: course.id,
                    x1: source.x + autoLayoutData.NODE_WIDTH,
                    y1: source.y + autoLayoutData.NODE_HEIGHT / 2,
                    x2: target.x,
                    y2: target.y + autoLayoutData.NODE_HEIGHT / 2,
                };
            }).filter((e): e is NonNullable<typeof e> => e !== null)
        );

        return { ...autoLayoutData, nodes, edges };
    }, [autoLayoutData, nodePositions, courses]);

    const handleMouseDown = (event: React.MouseEvent, courseId: string) => {
        if (interactionMode === 'navigate' || !svgRef.current) return;
        event.preventDefault();
        const svgPoint = svgRef.current.createSVGPoint();
        svgPoint.x = event.clientX;
        svgPoint.y = event.clientY;
        const CTM = svgRef.current.getScreenCTM()?.inverse();
        if (!CTM) return;
        const { x, y } = svgPoint.matrixTransform(CTM);

        const currentPos = nodePositions.get(courseId);
        if (currentPos) {
            setDraggedNode({ id: courseId, offsetX: x - currentPos.x, offsetY: y - currentPos.y });
        }
    };
    
    const handleMouseMove = (event: React.MouseEvent) => {
        if (!draggedNode || !svgRef.current) return;
        event.preventDefault();

        const svgPoint = svgRef.current.createSVGPoint();
        svgPoint.x = event.clientX;
        svgPoint.y = event.clientY;
        const CTM = svgRef.current.getScreenCTM()?.inverse();
        if (!CTM) return;
        const { x, y } = svgPoint.matrixTransform(CTM);
        
        let newX = x - draggedNode.offsetX;
        let newY = y - draggedNode.offsetY;

        if (interactionMode === 'grid') {
            const gridSize = 20;
            newX = Math.round(newX / gridSize) * gridSize;
            newY = Math.round(newY / gridSize) * gridSize;
        }

        setNodePositions(prev => new Map(prev).set(draggedNode.id, { x: newX, y: newY }));
    };

    const handleMouseUp = () => {
        setDraggedNode(null);
    };

    if (viewMode === 'horizontal') {
        return (
            <div className="h-full flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
                <div className="flex-grow overflow-auto relative">
                   <HorizontalFlow 
                        courses={courses}
                        onEditCourse={onEditCourse}
                        highlightMode={highlightMode}
                        departmentColors={departmentColors}
                        areaColors={areaColors}
                        hiddenCategories={hiddenCategories}
                        getCategoryNameForCourse={getCategoryNameForCourse}
                   />
                </div>
                {isLegendVisible &&
                    <div className="absolute top-4 left-4 z-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg shadow-lg w-64 max-h-[80vh] overflow-y-auto">
                        <FlowchartLegend
                            highlightMode={highlightMode}
                            courses={courses}
                            departmentColors={departmentColors}
                            areaColors={areaColors}
                            onHoverCategory={setHoveredCategory}
                            onToggleCategory={handleToggleCategory}
                            hiddenCategories={hiddenCategories}
                        />
                    </div>
                }
                <CourseDetailsModal course={selectedCourse} onClose={() => setSelectedCourse(null)} allCourses={courses} onEdit={onEditCourse} />
            </div>
        )
    }

  if (!finalLayoutData) {
      return <div className="p-6 text-center text-gray-500 dark:text-gray-400">Cargando malla curricular...</div>;
  }
    
  return (
        <div className="h-full flex overflow-hidden bg-gray-50 dark:bg-gray-900">
            <div className="flex-grow overflow-auto relative" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                <SemesterFlow
                    finalLayoutData={finalLayoutData}
                    interactionMode={interactionMode}
                    draggedNode={draggedNode}
                    isOrthogonalRouting={isOrthogonalRouting}
                    hoveredCourseId={hoveredCourseId}
                    relatedCourseIds={relatedCourseIds}
                    hiddenCategories={hiddenCategories}
                    hoveredCategory={hoveredCategory}
                    getHighlightColor={(course) => {
                        switch(highlightMode) {
                            case 'component': return COMPONENT_COLORS[course.competencia];
                            case 'evaluation': return EVALUATION_TYPE_COLORS[course.tipoMedicion];
                            case 'type': return COURSE_TYPE_COLORS[course.tipoAsignatura];
                            case 'department': return departmentColors[course.academicDepartments[0]] || 'fill-gray-600';
                            case 'area': return areaColors[course.areaAcademica] || 'fill-gray-600';
                            default: return 'fill-gray-600';
                        }
                    }}
                    getCategoryNameForCourse={getCategoryNameForCourse}
                    svgRef={svgRef}
                    handleMouseMove={handleMouseMove}
                    handleMouseUp={handleMouseUp}
                    onCourseClick={setSelectedCourse}
                    onCourseMouseDown={handleMouseDown}
                    onCourseMouseEnter={setHoveredCourseId}
                    onCourseMouseLeave={() => setHoveredCourseId(null)}
                />
            </div>
            {isLegendVisible && (
                <aside className="w-64 p-4 border-l border-gray-200 dark:border-gray-700 overflow-y-auto shrink-0 bg-white dark:bg-gray-800 shadow-lg">
                    <FlowchartLegend
                        highlightMode={highlightMode}
                        courses={courses}
                        departmentColors={departmentColors}
                        areaColors={areaColors}
                        onHoverCategory={setHoveredCategory}
                        onToggleCategory={handleToggleCategory}
                        hiddenCategories={hiddenCategories}
                    />
                </aside>
            )}
            <CourseDetailsModal course={selectedCourse} onClose={() => setSelectedCourse(null)} allCourses={courses} onEdit={onEditCourse} />
        </div>
    );
};

export default CurriculumFlowchart;