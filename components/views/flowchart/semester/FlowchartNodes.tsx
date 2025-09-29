
import React from 'react';
import type { Course } from '../../../../types';

interface Node {
    course: Course;
    x: number;
    y: number;
}

interface RelatedCourseIds {
    prereqs: Set<string>;
    dependents: Set<string>;
}

interface FlowchartNodesProps {
    nodes: Node[];
    NODE_WIDTH: number;
    NODE_HEIGHT: number;
    getHighlightColor: (course: Course) => string;
    getCategoryNameForCourse: (course: Course) => string;
    hiddenCategories: Set<string>;
    hoveredCourseId: string | null;
    relatedCourseIds: RelatedCourseIds | null;
    hoveredCategory: string | null;
    isDragActive: boolean;
    onCourseClick: (course: Course) => void;
    onCourseMouseDown: (event: React.MouseEvent, courseId: string) => void;
    onCourseMouseEnter: (courseId: string) => void;
    onCourseMouseLeave: () => void;
}

const FlowchartNodes: React.FC<FlowchartNodesProps> = ({
    nodes, NODE_WIDTH, NODE_HEIGHT, getHighlightColor, getCategoryNameForCourse,
    hiddenCategories, hoveredCourseId, relatedCourseIds, hoveredCategory, isDragActive,
    onCourseClick, onCourseMouseDown, onCourseMouseEnter, onCourseMouseLeave,
}) => {
    return (
        <g>
            {nodes.map(({ course, x, y }) => {
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
                        onClick={() => isInteractive && onCourseClick(course)}
                        onMouseDown={e => onCourseMouseDown(e, course.id)}
                        onMouseEnter={() => isInteractive && onCourseMouseEnter(course.id)}
                        onMouseLeave={onCourseMouseLeave}
                    >
                        <rect width={NODE_WIDTH} height={NODE_HEIGHT} rx={8} className={`${getHighlightColor(course)} transition-all ${!isDimmed ? 'group-hover:ring-2 group-hover:ring-indigo-400 group-hover:brightness-110' : ''}`} />
                        <foreignObject width={NODE_WIDTH} height={NODE_HEIGHT} requiredExtensions="http://www.w3.org/1999/xhtml">
                            <div className="w-full h-full p-2 flex flex-col justify-center items-center text-center text-white select-none">
                                <p className="text-xs font-bold leading-tight">{course.name}</p>
                                <p className="text-[10px] text-gray-200 mt-1">{course.casi} &bull; {course.credits}cr</p>
                            </div>
                        </foreignObject>
                    </g>
                );
            })}
        </g>
    );
};

export default FlowchartNodes;
