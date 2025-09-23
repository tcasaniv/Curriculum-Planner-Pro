import React from 'react';
import type { Course } from '../../../../types';
import FlowchartGrid from './FlowchartGrid';
import FlowchartEdges from './FlowchartEdges';
import FlowchartNodes from './FlowchartNodes';

// Define types locally for clarity
interface LayoutData {
    nodes: Array<{ course: Course; x: number; y: number }>;
    edges: Array<{
        id: string;
        sourceId: string;
        targetId: string;
        x1: number;
        y1: number;
        x2: number;
        y2: number;
    }>;
    width: number;
    height: number;
    numSemesters: number;
    COL_WIDTH: number;
    PADDING: number;
    HEADER_HEIGHT: number;
    NODE_WIDTH: number;
    NODE_HEIGHT: number;
    COL_GAP: number;
    semesterCredits: Record<number, number>;
}

interface RelatedCourseIds {
    prereqs: Set<string>;
    dependents: Set<string>;
}

interface SemesterFlowProps {
    finalLayoutData: LayoutData;
    interactionMode: 'navigate' | 'grid' | 'free';
    draggedNode: { id: string; offsetX: number; offsetY: number } | null;
    isOrthogonalRouting: boolean;
    hoveredCourseId: string | null;
    relatedCourseIds: RelatedCourseIds | null;
    hiddenCategories: Set<string>;
    hoveredCategory: string | null;
    getHighlightColor: (course: Course) => string;
    getCategoryNameForCourse: (course: Course) => string;
    svgRef: React.RefObject<SVGSVGElement>;
    handleMouseMove: (event: React.MouseEvent) => void;
    handleMouseUp: () => void;
    onCourseClick: (course: Course) => void;
    onCourseMouseDown: (event: React.MouseEvent, courseId: string) => void;
    onCourseMouseEnter: (courseId: string) => void;
    onCourseMouseLeave: () => void;
}

const SemesterFlow: React.FC<SemesterFlowProps> = ({
    finalLayoutData,
    interactionMode,
    draggedNode,
    isOrthogonalRouting,
    hoveredCourseId,
    relatedCourseIds,
    hiddenCategories,
    hoveredCategory,
    getHighlightColor,
    getCategoryNameForCourse,
    svgRef,
    handleMouseMove,
    handleMouseUp,
    onCourseClick,
    onCourseMouseDown,
    onCourseMouseEnter,
    onCourseMouseLeave
}) => {
    const isDragActive = interactionMode === 'free' || interactionMode === 'grid';

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
            
            <FlowchartGrid
                numSemesters={finalLayoutData.numSemesters}
                width={finalLayoutData.width}
                height={finalLayoutData.height}
                PADDING={finalLayoutData.PADDING}
                HEADER_HEIGHT={finalLayoutData.HEADER_HEIGHT}
                COL_WIDTH={finalLayoutData.COL_WIDTH}
                COL_GAP={finalLayoutData.COL_GAP}
                semesterCredits={finalLayoutData.semesterCredits}
            />

            <FlowchartEdges
                edges={finalLayoutData.edges}
                hoveredCourseId={hoveredCourseId}
                isOrthogonalRouting={isOrthogonalRouting}
            />

            <FlowchartNodes
                nodes={finalLayoutData.nodes}
                NODE_WIDTH={finalLayoutData.NODE_WIDTH}
                NODE_HEIGHT={finalLayoutData.NODE_HEIGHT}
                getHighlightColor={getHighlightColor}
                getCategoryNameForCourse={getCategoryNameForCourse}
                hiddenCategories={hiddenCategories}
                hoveredCourseId={hoveredCourseId}
                relatedCourseIds={relatedCourseIds}
                hoveredCategory={hoveredCategory}
                isDragActive={isDragActive}
                onCourseClick={onCourseClick}
                onCourseMouseDown={onCourseMouseDown}
                onCourseMouseEnter={onCourseMouseEnter}
                onCourseMouseLeave={onCourseMouseLeave}
            />
        </svg>
    );
};

export default SemesterFlow;
