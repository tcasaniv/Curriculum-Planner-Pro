import React from 'react';
import { romanize } from '../../../../utils';

interface FlowchartGridProps {
    numSemesters: number;
    width: number;
    height: number;
    PADDING: number;
    HEADER_HEIGHT: number;
    COL_WIDTH: number;
    COL_GAP: number;
    semesterCredits: Record<number, number>;
}

const FlowchartGrid: React.FC<FlowchartGridProps> = ({
    numSemesters,
    width,
    height,
    PADDING,
    HEADER_HEIGHT,
    COL_WIDTH,
    COL_GAP,
    semesterCredits,
}) => {
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

export default FlowchartGrid;
