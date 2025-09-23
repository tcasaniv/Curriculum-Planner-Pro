import React from 'react';

interface Edge {
    id: string;
    sourceId: string;
    targetId: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

interface FlowchartEdgesProps {
    edges: Edge[];
    hoveredCourseId: string | null;
    isOrthogonalRouting: boolean;
}

const FlowchartEdges: React.FC<FlowchartEdgesProps> = ({ edges, hoveredCourseId, isOrthogonalRouting }) => {
    return (
        <g>
            {edges.map(edge => {
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
    );
};

export default FlowchartEdges;
