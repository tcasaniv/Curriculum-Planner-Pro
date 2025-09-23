import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { Course, HighlightMode } from '../../types';
import { 
    COMPONENT_COLORS, EVALUATION_TYPE_COLORS, COURSE_TYPE_COLORS,
    COMPONENT_NAMES, EVALUATION_TYPE_NAMES, COURSE_TYPE_NAMES 
} from '../../constants';
import { romanize } from '../../utils';
import CourseDetailsModal from '../common/CourseDetailsModal';
import FlowchartLegend from './flowchart/FlowchartLegend';
import FlowchartControls from './flowchart/FlowchartControls';
import HorizontalFlow from './flowchart/HorizontalFlow';

interface CurriculumFlowchartProps {
  courses: Course[];
  onEditCourse: (course: Course) => void;
}

const CurriculumFlowchart: React.FC<CurriculumFlowchartProps> = ({ courses, onEditCourse }) => {
  const [highlightMode, setHighlightMode] = useState<HighlightMode>('component');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLayoutOptimized, setIsLayoutOptimized] = useState(true);
  const [isSpacedLayout, setIsSpacedLayout] = useState(false);
  const [isGridSnapMode, setIsGridSnapMode] = useState(false);
  const [isFreeDragMode, setIsFreeDragMode] = useState(false);
  const [isOrthogonalRouting, setIsOrthogonalRouting] = useState(false);
  const [isHorizontalFlowMode, setIsHorizontalFlowMode] = useState(false);
  
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
        const canDoStrategicLayout = isSpacedLayout && isLayoutOptimized && semNum > 1;

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
    const isDragActive = isFreeDragMode || isGridSnapMode;
    if (autoLayoutData && !isDragActive) {
        const newPositions = new Map<string, {x: number, y: number}>();
        autoLayoutData.nodes.forEach(node => {
            newPositions.set(node.course.id, { x: node.x, y: node.y });
        });
        setNodePositions(newPositions);
    }
  }, [autoLayoutData, isFreeDragMode, isGridSnapMode]);

  const finalLayoutData = useMemo(() => {
    const isDragActive = isFreeDragMode || isGridSnapMode;
    if (!autoLayoutData || !isDragActive) return autoLayoutData;

    const nodes = courses.map(course => {
      const autoNodeForPos = autoLayoutData.nodes.find(n => n.course.id === course.id);
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
  }, [autoLayoutData, isFreeDragMode, isGridSnapMode, nodePositions, courses]);

  const handleMouseDown = (event: React.MouseEvent, courseId: string) => {
    const isDragActive = isFreeDragMode || isGridSnapMode;
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

    if (isGridSnapMode) {
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
    } else { // isFreeDragMode
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
  
  const handleHorizontalFlowToggle = (checked: boolean) => {
    setIsHorizontalFlowMode(checked);
    if (checked) {
      setIsFreeDragMode(false);
      setIsGridSnapMode(false);
    }
  };
  
  const handleFreeDragToggle = (checked: boolean) => {
    setIsFreeDragMode(checked);
    if (checked) {
      setIsGridSnapMode(false);
      setIsHorizontalFlowMode(false);
    }
  };
  
  const handleGridSnapToggle = (checked: boolean) => {
    setIsGridSnapMode(checked);
    if (checked) {
      setIsFreeDragMode(false);
      setIsHorizontalFlowMode(false);
    }
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

  const renderGrid = () => {
    if (!finalLayoutData) return null;
    const { numSemesters, width, height, PADDING, HEADER_HEIGHT, COL_WIDTH, COL_GAP, semesterCredits } = finalLayoutData;
    const gridElements = [];

    for (let i = 0; i < numSemesters; i++) {
        const x = PADDING + i * COL_WIDTH;
        const semesterNumber = i + 1;
        // Header Text
        gridElements.push(
            <g key={`header-group-${i}`}>
                <text x={x + COL_WIDTH/2 - COL_GAP/2} y={PADDING + HEADER_HEIGHT / 2 - 10} textAnchor="middle" dominantBaseline="middle" className="fill-gray-500 dark:fill-gray-400" fontSize="18" fontWeight="bold">
                    {romanize(semesterNumber)}
                </text>
                 <text x={x + COL_WIDTH/2 - COL_GAP/2} y={PADDING + HEADER_HEIGHT / 2 + 15} textAnchor="middle" dominantBaseline="middle" className="fill-indigo-600 dark:fill-indigo-400" fontSize="12" fontWeight="semibold">
                    {`Créditos: ${semesterCredits[semesterNumber] || 0}`}
                </text>
            </g>
        );
        // Vertical Line
        if (i < numSemesters -1) {
             gridElements.push(
                <line key={`vline-${i}`} x1={x + COL_WIDTH - COL_GAP/2} y1={PADDING} x2={x + COL_WIDTH - COL_GAP/2} y2={height - PADDING} className="stroke-gray-300 dark:stroke-gray-700" strokeWidth="1" />
             );
        }
    }
     gridElements.push(<line key="hline" x1={PADDING} y1={PADDING + HEADER_HEIGHT} x2={width - PADDING} y2={PADDING + HEADER_HEIGHT} className="stroke-gray-300 dark:stroke-gray-700" strokeWidth="1"/>);

    return <g>{gridElements}</g>;
  };


  const renderSemesterFlowchart = () => {
    if (!finalLayoutData) return <div className="text-center p-8 text-gray-400">Generando malla curricular...</div>;
    const isDragActive = isFreeDragMode || isGridSnapMode;
    
    return (
        <svg
            ref={svgRef} 
            width={finalLayoutData.width} 
            height={finalLayoutData.height} 
            className={`min-w-full ${isDragActive && draggedNode ? 'cursor-grabbing' : ''}`}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            <defs>
                <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" className="fill-gray-400 dark:fill-gray-500" />
                </marker>
                 <marker id="arrowhead-highlighted" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                    <path d="M 0 0 L 10 5 L 0 10 z" className="fill-indigo-500 dark:fill-indigo-400" />
                </marker>
            </defs>
            
            {renderGrid()}

            <g>
            {finalLayoutData.edges.map(edge => {
                const isHighlighted = hoveredCourseId && (edge.sourceId === hoveredCourseId || edge.targetId === hoveredCourseId);
                const strokeClass = isHighlighted ? 'stroke-indigo-500 dark:stroke-indigo-400' : 'stroke-gray-400 dark:stroke-gray-600';
                const strokeWidth = isHighlighted ? 2.5 : 1.5;
                const marker = isHighlighted ? 'url(#arrowhead-highlighted)' : 'url(#arrowhead)';

                if (isOrthogonalRouting) {
                    const midX = edge.x1 + (edge.x2 - edge.x1) / 2;
                    let d: string;

                    if (Math.abs(edge.y1 - edge.y2) < 1) { // Use a small tolerance for floating point
                        d = `M ${edge.x1} ${edge.y1} L ${edge.x2} ${edge.y2}`;
                    } else {
                        const radius = 15;
                        const ySign = Math.sign(edge.y2 - edge.y1);
                        
                        const verticalSegmentLength = Math.abs(edge.y2 - edge.y1);
                        const horizontalSegmentLength = (edge.x2 - edge.x1) / 2;
                        
                        const effectiveRadius = Math.max(0, Math.min(radius, verticalSegmentLength / 2, horizontalSegmentLength));

                        if (effectiveRadius > 1) { // Only apply radius if it's meaningful
                            d = `M ${edge.x1} ${edge.y1} ` +
                                `L ${midX - effectiveRadius} ${edge.y1} ` +
                                `Q ${midX} ${edge.y1} ${midX} ${edge.y1 + effectiveRadius * ySign} ` +
                                `V ${edge.y2 - effectiveRadius * ySign} ` +
                                `Q ${midX} ${edge.y2} ${midX + effectiveRadius} ${edge.y2} ` +
                                `L ${edge.x2} ${edge.y2}`;
                        } else {
                            // fallback to sharp corners if not enough space for radius
                            d = `M ${edge.x1} ${edge.y1} H ${midX} V ${edge.y2} H ${edge.x2}`;
                        }
                    }

                    return (
                        <path
                            key={edge.id}
                            d={d}
                            className={`${strokeClass} transition-all duration-200`}
                            strokeWidth={strokeWidth}
                            fill="none"
                            markerEnd={marker}
                        />
                    );
                }
                return (
                    <line 
                        key={edge.id}
                        x1={edge.x1}
                        y1={edge.y1}
                        x2={edge.x2}
                        y2={edge.y2}
                        className={`${strokeClass} transition-all duration-200`}
                        strokeWidth={strokeWidth}
                        markerEnd={marker}
                    />
                );
            })}
            </g>

            <g>
            {finalLayoutData.nodes.map(({ course, x, y }) => {
                const courseCategoryName = getCategoryNameForCourse(course);
                const isHidden = hiddenCategories.has(courseCategoryName);
                
                let isDimmed = false;
                if (hoveredCourseId) {
                    const isHovered = course.id === hoveredCourseId;
                    const isRelated = relatedCourseIds?.prereqs.has(course.id) || relatedCourseIds?.dependents.has(course.id);
                    isDimmed = !isHovered && !isRelated;
                } else {
                    isDimmed = hoveredCategory ? hoveredCategory !== courseCategoryName : isHidden;
                }
                
                const isInteractive = !isDragActive && !(isHidden && !hoveredCourseId);
                
                return (
                    <g 
                        key={course.id} 
                        transform={`translate(${x}, ${y})`} 
                        className={`group transition-opacity duration-300 ${isDimmed ? 'opacity-20' : 'opacity-100'} ${isDragActive ? 'cursor-grab' : 'cursor-pointer'}`}
                        onClick={() => isInteractive && setSelectedCourse(course)}
                        onMouseDown={e => handleMouseDown(e, course.id)}
                        onMouseEnter={() => isInteractive && setHoveredCourseId(course.id)}
                        onMouseLeave={() => setHoveredCourseId(null)}
                    >
                        <rect width={finalLayoutData.NODE_WIDTH} height={finalLayoutData.NODE_HEIGHT} rx={8} className={`${getHighlightColor(course)} transition-all ${!isDimmed ? 'group-hover:ring-2 group-hover:ring-indigo-400 group-hover:brightness-110' : ''}`} />
                        <foreignObject width={finalLayoutData.NODE_WIDTH} height={finalLayoutData.NODE_HEIGHT} requiredExtensions="http://www.w3.org/1999/xhtml">
                            <div className="w-full h-full p-2 flex flex-col justify-center items-center text-center text-white select-none">
                                <p className="text-xs font-bold leading-tight">{course.name}</p>
                                <p className="text-[10px] text-gray-200 mt-1">{course.id} &bull; {course.credits}cr</p>
                            </div>
                        </foreignObject>
                    </g>
                );
            })}
            </g>
        </svg>
    );
  };

  return (
    <div className="h-full flex flex-col">
        <FlowchartControls 
            isLayoutOptimized={isLayoutOptimized}
            onLayoutOptimizedChange={setIsLayoutOptimized}
            isSpacedLayout={isSpacedLayout}
            onSpacedLayoutChange={setIsSpacedLayout}
            isOrthogonalRouting={isOrthogonalRouting}
            onOrthogonalRoutingChange={setIsOrthogonalRouting}
            isGridSnapMode={isGridSnapMode}
            onGridSnapModeChange={handleGridSnapToggle}
            isFreeDragMode={isFreeDragMode}
            onFreeDragModeChange={handleFreeDragToggle}
            isHorizontalFlowMode={isHorizontalFlowMode}
            onIsHorizontalFlowModeChange={handleHorizontalFlowToggle}
            highlightMode={highlightMode}
            onHighlightModeChange={setHighlightMode}
        />
        <div className="flex-grow flex overflow-hidden">
            <div className="flex-grow overflow-auto p-4 bg-gray-50 dark:bg-gray-900 relative">
                { isHorizontalFlowMode ? (
                    <HorizontalFlow 
                        courses={courses}
                        onEditCourse={onEditCourse}
                        highlightMode={highlightMode}
                        departmentColors={departmentColors}
                        areaColors={areaColors}
                        hiddenCategories={hiddenCategories}
                        getCategoryNameForCourse={getCategoryNameForCourse}
                    />
                ) : (
                    renderSemesterFlowchart() 
                )}
            </div>
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
        </div>
      <CourseDetailsModal course={selectedCourse} onClose={() => setSelectedCourse(null)} allCourses={courses} onEdit={onEditCourse} />
    </div>
  );
};

export default CurriculumFlowchart;
