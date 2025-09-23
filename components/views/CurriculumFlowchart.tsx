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

                if (avgYA === avgYB) return courseA.id.localeCompare(courseB.id);
                if (avgYA === Infinity && avgYB === Infinity) return courseA.id.localeCompare(courseB.id);
                return avgYA - avgYB;
            });
        } else {
            coursesToLayout.sort((a,b) => a.id.localeCompare(b.id));
        }

        // 2. Placement
        const baseY = PADDING + HEADER_HEIGHT;
        const colIndex = semNum - 1;
        const canDoStrategicLayout = isSpacedLayout && semNum > 1;

        if (canDoStrategicLayout) {
            let nextAvailableRow = 0;
            const rowHeight = NODE_HEIGHT + STRATEGIC_ROW_GAP;

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
                    const idealRowCandidate = Math.round((idealNodeTopY - baseY) / rowHeight);
                    finalRowIndex = Math.max(nextAvailableRow, idealRowCandidate);
                } else {
                    finalRowIndex = nextAvailableRow;
                }

                const y = baseY + finalRowIndex * rowHeight;
                nodes.set(course.id, { course, x: PADDING + colIndex * COL_WIDTH, y });
                nextAvailableRow = finalRowIndex + 1;
            });
        } else {
            // Fallback to original logic (compact or simple wide spacing)
            const rowHeight = NODE_HEIGHT + rowGap;
            coursesToLayout.forEach((course, rowIndex) => {
                const y = baseY + rowIndex * rowHeight;
                nodes.set(course.id, { course, x: PADDING + colIndex * COL_WIDTH, y });
            });
        }
    });
    
    // Calculate final dimensions
    const allNodeYs = Array.from(nodes.values()).map(n => n.y);
    const maxY = allNodeYs.length > 0 ? Math.max(...allNodeYs) : 0;
    const totalHeight = maxY + NODE_HEIGHT + PADDING * 2;
    const totalWidth = numSemesters * COL_WIDTH - COL_GAP + PADDING * 2;

    const edges = [];
    for (const node of nodes.values()) {
        for (const prereqId of node.course.prerequisites) {
            const sourceNode = nodes.get(prereqId);
            if (sourceNode) {
                edges.push({
                    id: `${prereqId}-${node.course.id}`,
                    sourceId: prereqId,
                    targetId: node.course.id,
                    x1: sourceNode.x + NODE_WIDTH,
                    y1: sourceNode.y + NODE_HEIGHT / 2,
                    x2: node.x,
                    y2: node.y + NODE_HEIGHT / 2,
                });
            }
        }
    }

    return { nodes: Array.from(nodes.values()), edges, width: totalWidth, height: totalHeight, numSemesters, COL_WIDTH, PADDING, HEADER_HEIGHT, NODE_WIDTH, NODE_HEIGHT, COL_GAP, semesterCredits, rowGap };
  }, [courses, isLayoutOptimized, isSpacedLayout]);

  useEffect(() => {
    const isDragActive = interactionMode === 'free' || interactionMode === 'grid';
    if (autoLayoutData && !isDragActive) {
        const newPositions = new Map<string, {x: number, y: number}>();
        autoLayoutData.nodes.forEach(node => {
            newPositions.set(node.course.id, { x: node.x, y: node.y });
        });
        setNodePositions(newPositions);
    }
  }, [autoLayoutData, interactionMode]);

  const finalLayoutData = useMemo(() => {
    const isDragActive = interactionMode === 'free' || interactionMode === 'grid';
    if (!autoLayoutData || !isDragActive) return autoLayoutData;

    const nodes = courses.map(course => {
      // FIX: Explicitly cast `autoLayoutData.nodes` to a typed array. This prevents `find` from returning `unknown` and causing property access errors on `autoNodeForPos`.
      const autoNodeForPos = (autoLayoutData.nodes as { course: Course; x: number; y: number }[]).find(n => n.course.id === course.id);
      const pos = nodePositions.get(course.id) ?? {x: autoNodeForPos?.x ?? 0, y: autoNodeForPos?.y ?? 0};
      return { course, ...pos };
    });

    const nodeMap = new Map(nodes.map(n => [n.course.id, n]));
    
    const edges = [];
    for (const node of nodes) {
        for (const prereqId of node.course.prerequisites) {
            const sourceNode = nodeMap.get(prereqId);
            const targetNode = node;
            if (sourceNode && targetNode) {
                edges.push({
                    id: `${prereqId}-${node.course.id}`,
                    sourceId: prereqId,
                    targetId: node.course.id,
                    x1: sourceNode.x + autoLayoutData.NODE_WIDTH,
                    y1: sourceNode.y + autoLayoutData.NODE_HEIGHT / 2,
                    x2: targetNode.x,
                    y2: targetNode.y + autoLayoutData.NODE_HEIGHT / 2,
                });
            }
        }
    }

    return { ...autoLayoutData, nodes, edges };
  }, [autoLayoutData, interactionMode, nodePositions, courses]);

  const handleMouseDown = (event: React.MouseEvent, courseId: string) => {
    const isDragActive = interactionMode === 'free' || interactionMode === 'grid';
    if (!isDragActive || !svgRef.current) return;
    event.preventDefault();
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;
    const mouseSvgX = (event.clientX - CTM.e) / CTM.a;
    const mouseSvgY = (event.clientY - CTM.f) / CTM.d;

    const nodePos = nodePositions.get(courseId);
    if (!nodePos) return;

    setDraggedNode({ 
        id: courseId, 
        offsetX: mouseSvgX - nodePos.x, 
        offsetY: mouseSvgY - nodePos.y 
    });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!draggedNode || !svgRef.current || !finalLayoutData) return;
    const CTM = svgRef.current.getScreenCTM();
    if (!CTM) return;
    const mouseSvgX = (event.clientX - CTM.e) / CTM.a;
    const mouseSvgY = (event.clientY - CTM.f) / CTM.d;
    
    const newX = mouseSvgX - draggedNode.offsetX;
    const newY = mouseSvgY - draggedNode.offsetY;

    if (interactionMode === 'grid') {
        const { PADDING, HEADER_HEIGHT, NODE_HEIGHT, COL_WIDTH, NODE_WIDTH: nodeWidth, rowGap } = finalLayoutData;
        const rowHeight = NODE_HEIGHT + rowGap;
        
        const nodeCenterX = newX + nodeWidth / 2;
        const nodeCenterY = newY + NODE_HEIGHT / 2;

        const colIndex = Math.max(0, Math.round((nodeCenterX - PADDING - nodeWidth / 2) / COL_WIDTH));
        const rowIndex = Math.max(0, Math.round((nodeCenterY - PADDING - HEADER_HEIGHT - NODE_HEIGHT / 2) / rowHeight));

        const snappedX = PADDING + colIndex * COL_WIDTH;
        const snappedY = PADDING + HEADER_HEIGHT + rowIndex * rowHeight;
        
        setNodePositions(prev => {
            const newPositions = new Map(prev);
            newPositions.set(draggedNode.id, { x: snappedX, y: snappedY });
            return newPositions;
        });
    } else { // free mode
        setNodePositions(prev => {
            const newPositions = new Map(prev);
            newPositions.set(draggedNode.id, { x: newX, y: newY });
            return newPositions;
        });
    }
  };

  const handleMouseUp = () => {
    setDraggedNode(null);
  };
  
  const getHighlightColor = (course: Course) => {
    switch(highlightMode) {
      case 'component': return COMPONENT_COLORS[course.competencia];
      case 'evaluation': return EVALUATION_TYPE_COLORS[course.tipoMedicion];
      case 'type': return COURSE_TYPE_COLORS[course.tipoAsignatura];
      case 'department': return departmentColors[course.academicDepartments[0]] || 'fill-gray-600';
      case 'area': return areaColors[course.areaAcademica] || 'fill-gray-600';
      default: return 'fill-gray-600';
    }
  };
  
  if (!courses.length) return <div className="text-center p-8 text-gray-500 dark:text-gray-400">No hay asignaturas para mostrar. Comience añadiendo una o importando un plan.</div>;

  return (
    <div className="h-full flex flex-col">
        <div className="flex-grow flex overflow-hidden">
            <div className="flex-grow overflow-auto p-4 bg-gray-50 dark:bg-gray-900 relative">
                { viewMode === 'horizontal' ? (
                    <HorizontalFlow 
                        courses={courses} 
                        onEditCourse={onEditCourse}
                        highlightMode={highlightMode}
                        departmentColors={departmentColors}
                        areaColors={areaColors}
                        hiddenCategories={hiddenCategories}
                        getCategoryNameForCourse={getCategoryNameForCourse}
                    />
                ) : !finalLayoutData ? (
                    <div className="text-center p-8 text-gray-400">Generando malla curricular...</div>
                ) : (
                    <SemesterFlow
                        finalLayoutData={finalLayoutData}
                        interactionMode={interactionMode}
                        draggedNode={draggedNode}
                        isOrthogonalRouting={isOrthogonalRouting}
                        hoveredCourseId={hoveredCourseId}
                        relatedCourseIds={relatedCourseIds}
                        hiddenCategories={hiddenCategories}
                        hoveredCategory={hoveredCategory}
                        getHighlightColor={getHighlightColor}
                        getCategoryNameForCourse={getCategoryNameForCourse}
                        svgRef={svgRef}
                        handleMouseMove={handleMouseMove}
                        handleMouseUp={handleMouseUp}
                        onCourseClick={setSelectedCourse}
                        onCourseMouseDown={handleMouseDown}
                        onCourseMouseEnter={setHoveredCourseId}
                        onCourseMouseLeave={() => setHoveredCourseId(null)}
                    />
                )}
            </div>
            {isLegendVisible && (
             <aside className="w-72 bg-white dark:bg-gray-800 p-4 overflow-y-auto border-l border-gray-200 dark:border-gray-700 shrink-0">
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
        </div>
      <CourseDetailsModal course={selectedCourse} onClose={() => setSelectedCourse(null)} allCourses={courses} onEdit={onEditCourse} />
    </div>
  );
};

export default CurriculumFlowchart;
