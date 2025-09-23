import React, { useState, useMemo } from 'react';
import type { Course, HighlightMode } from '../../../types';
import { 
    COMPONENT_COLORS, EVALUATION_TYPE_COLORS, COURSE_TYPE_COLORS
} from '../../../constants';
import { romanize } from '../../../utils';
import CourseDetailsModal from '../../common/CourseDetailsModal';

interface HorizontalFlowProps {
  courses: Course[];
  onEditCourse: (course: Course) => void;
  highlightMode: HighlightMode;
  departmentColors: Record<string, string>;
  areaColors: Record<string, string>;
  hiddenCategories: Set<string>;
  getCategoryNameForCourse: (course: Course) => string;
}

// FIX: Define an interface for graph nodes to help with type inference.
interface GraphNode {
  course: Course;
  children: Set<string>;
  parents: Set<string>;
}

const HorizontalFlow: React.FC<HorizontalFlowProps> = ({
    courses, onEditCourse, highlightMode, departmentColors, areaColors, hiddenCategories, getCategoryNameForCourse
}) => {
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
    const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);

    const layoutData = useMemo(() => {
        if (courses.length === 0) return null;

        // FIX: Explicitly type `courseMap` to ensure `.get()` returns `Course | undefined` instead of `unknown`.
        const courseMap = new Map<string, Course>(courses.map(c => [c.id, c]));

        // Build graph with children references
        const graph = new Map<string, GraphNode>(courses.map(c => [c.id, { course: c, children: new Set<string>(), parents: new Set<string>(c.prerequisites) }]));
        courses.forEach(c => {
            c.prerequisites.forEach(prereqId => {
                const prereqNode = graph.get(prereqId);
                if (prereqNode) {
                    prereqNode.children.add(c.id);
                }
            });
        });

        // Find endpoints (courses with no children)
        const endpoints = courses.filter(c => graph.get(c.id)?.children.size === 0);

        // Generate all paths leading to each endpoint
        const allPaths: string[][] = [];
        const findPaths = (courseId: string, currentPath: string[]) => {
            const courseNode = graph.get(courseId);
            if (!courseNode) return;

            const newPath = [courseId, ...currentPath];

            if (courseNode.parents.size === 0) {
                allPaths.push(newPath);
                return;
            }

            courseNode.parents.forEach(parentId => {
                findPaths(parentId, newPath);
            });
        };

        endpoints.forEach(endpoint => {
            findPaths(endpoint.id, []);
        });

        // Deduplicate and sort paths
        const uniquePaths = Array.from(new Set(allPaths.map(p => p.join(',')))).map(s => s.split(','));
        uniquePaths.sort((a, b) => {
            // Sort by path length, then by last element's semester, then ID
            if (a.length !== b.length) return a.length - b.length;
            // FIX: Add explicit types to fix errors on .semester and .id
            const lastA: Course | undefined = courseMap.get(a[a.length - 1]);
            const lastB: Course | undefined = courseMap.get(b[b.length - 1]);
            if (!lastA || !lastB) return 0;
            if (lastA.semester !== lastB.semester) return lastA.semester - lastB.semester;
            return lastA.id.localeCompare(lastB.id);
        });

        // Constants for layout
        const NODE_WIDTH = 160;
        const NODE_HEIGHT = 80;
        const COL_GAP = 60;
        const ROW_GAP = 40;
        const PADDING = 20;
        const HEADER_HEIGHT = 60;
        const LANE_HEIGHT = NODE_HEIGHT + ROW_GAP;
        const COL_WIDTH = NODE_WIDTH + COL_GAP;
        
        const maxSemester = Math.max(1, ...courses.map(c => c.semester));
        const totalWidth = (maxSemester) * COL_WIDTH + PADDING * 2 - COL_GAP;
        const totalHeight = uniquePaths.length * LANE_HEIGHT + PADDING + HEADER_HEIGHT;

        const nodes: { uniqueId: string; course: Course; x: number; y: number }[] = [];
        const edges: { id: string; sourceUniqueId: string; targetUniqueId: string; }[] = [];
        const pathConnections = new Set<string>();

        uniquePaths.forEach((path, pathIndex) => {
            path.forEach((courseId, courseIndex) => {
                // FIX: Add explicit type to fix errors on .id, .semester, etc.
                const course: Course | undefined = courseMap.get(courseId);
                if (!course) return;

                nodes.push({
                    uniqueId: `${pathIndex}-${courseIndex}-${course.id}`,
                    course,
                    x: PADDING + (course.semester - 1) * COL_WIDTH,
                    y: PADDING + HEADER_HEIGHT + pathIndex * LANE_HEIGHT,
                });

                if (courseIndex > 0) {
                    const prevCourseId = path[courseIndex - 1];
                    // FIX: Add explicit type to fix errors on .id
                    const prevCourse: Course | undefined = courseMap.get(prevCourseId);
                    if (prevCourse) {
                        const edgeId = `${pathIndex}:${prevCourseId}>${courseId}`;
                        if (!pathConnections.has(edgeId)) {
                             edges.push({
                                id: edgeId,
                                sourceUniqueId: `${pathIndex}-${courseIndex - 1}-${prevCourse.id}`,
                                targetUniqueId: `${pathIndex}-${courseIndex}-${course.id}`,
                            });
                            pathConnections.add(edgeId);
                        }
                    }
                }
            });
        });

        const nodeMap = new Map(nodes.map(n => [n.uniqueId, n]));

        const finalEdges = edges.map(edge => {
            const sourceNode = nodeMap.get(edge.sourceUniqueId);
            const targetNode = nodeMap.get(edge.targetUniqueId);
            if (!sourceNode || !targetNode) return null;

            return {
                id: edge.id,
                sourceCourseId: sourceNode.course.id,
                targetCourseId: targetNode.course.id,
                x1: sourceNode.x + NODE_WIDTH,
                y1: sourceNode.y + NODE_HEIGHT / 2,
                x2: targetNode.x,
                y2: targetNode.y + NODE_HEIGHT / 2,
            };
        }).filter((e): e is NonNullable<typeof e> => e !== null);

        return { nodes, edges: finalEdges, width: totalWidth, height: totalHeight, NODE_WIDTH, NODE_HEIGHT, maxSemester, COL_WIDTH, PADDING, HEADER_HEIGHT, COL_GAP };

    }, [courses]);
    
    const relatedHoverIds = useMemo(() => {
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

    if (!layoutData) {
        return <div className="text-center p-8 text-gray-500 dark:text-gray-400">Generando vista de flujo...</div>;
    }
    
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
    
    const renderGrid = () => {
        const { maxSemester, width, height, PADDING, HEADER_HEIGHT, COL_WIDTH, COL_GAP } = layoutData;
        const gridElements = [];

        for (let i = 0; i < maxSemester; i++) {
            const x = PADDING + i * COL_WIDTH;
            const semesterNumber = i + 1;
            gridElements.push(
                <text key={`header-text-${i}`} x={x + (COL_WIDTH - COL_GAP) / 2} y={PADDING + HEADER_HEIGHT / 2} textAnchor="middle" dominantBaseline="middle" className="fill-gray-500 dark:fill-gray-400" fontSize="18" fontWeight="bold">
                    {romanize(semesterNumber)}
                </text>
            );
            if (i < maxSemester - 1) {
                gridElements.push(
                    <line key={`vline-${i}`} x1={x + COL_WIDTH - COL_GAP / 2} y1={PADDING} x2={x + COL_WIDTH - COL_GAP / 2} y2={height - PADDING} className="stroke-gray-300 dark:stroke-gray-700" strokeWidth="1" />
                );
            }
        }
        gridElements.push(<line key="hline" x1={PADDING} y1={PADDING + HEADER_HEIGHT} x2={width - PADDING} y2={PADDING + HEADER_HEIGHT} className="stroke-gray-300 dark:stroke-gray-700" strokeWidth="1" />);
        return <g>{gridElements}</g>;
    };

    return (
        <>
            <svg width={layoutData.width} height={layoutData.height} className="min-w-full">
                <defs>
                    <marker id="arrowhead-h" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" className="fill-gray-400 dark:fill-gray-500" />
                    </marker>
                    <marker id="arrowhead-highlighted-h" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" className="fill-indigo-500 dark:fill-indigo-400" />
                    </marker>
                </defs>
                
                {renderGrid()}

                <g> {/* Edges */}
                    {layoutData.edges.map(edge => {
                        const isHighlighted = hoveredCourseId && (edge.sourceCourseId === hoveredCourseId || edge.targetCourseId === hoveredCourseId);
                        const strokeClass = isHighlighted ? 'stroke-indigo-500 dark:stroke-indigo-400' : 'stroke-gray-400 dark:stroke-gray-600';
                        const strokeWidth = isHighlighted ? 2.5 : 1.5;
                        const marker = isHighlighted ? 'url(#arrowhead-highlighted-h)' : 'url(#arrowhead-h)';

                        return <line key={edge.id} x1={edge.x1} y1={edge.y1} x2={edge.x2} y2={edge.y2} className={`${strokeClass} transition-all duration-200`} strokeWidth={strokeWidth} markerEnd={marker} />;
                    })}
                </g>

                <g> {/* Nodes */}
                    {layoutData.nodes.map(({ uniqueId, course, x, y }) => {
                        const courseCategoryName = getCategoryNameForCourse(course);
                        const isHidden = hiddenCategories.has(courseCategoryName);

                        let isDimmed = isHidden;
                        if (hoveredCourseId) {
                            const isHovered = course.id === hoveredCourseId;
                            const isRelated = relatedHoverIds?.prereqs.has(course.id) || relatedHoverIds?.dependents.has(course.id);
                            isDimmed = !isHovered && !isRelated;
                        }

                        return (
                            <g 
                                key={uniqueId} 
                                transform={`translate(${x}, ${y})`} 
                                className={`group transition-opacity duration-300 ${isDimmed ? 'opacity-20' : 'opacity-100'} cursor-pointer`}
                                onClick={() => !isHidden && setSelectedCourse(course)}
                                onMouseEnter={() => setHoveredCourseId(course.id)}
                                onMouseLeave={() => setHoveredCourseId(null)}
                            >
                                <rect width={layoutData.NODE_WIDTH} height={layoutData.NODE_HEIGHT} rx={8} className={`${getHighlightColor(course)} transition-all ${!isDimmed ? 'group-hover:ring-2 group-hover:ring-indigo-400 group-hover:brightness-110' : ''}`} />
                                <foreignObject width={layoutData.NODE_WIDTH} height={layoutData.NODE_HEIGHT} requiredExtensions="http://www.w3.org/1999/xhtml">
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
            <CourseDetailsModal course={selectedCourse} onClose={() => setSelectedCourse(null)} allCourses={courses} onEdit={onEditCourse} />
        </>
    );
};

export default HorizontalFlow;