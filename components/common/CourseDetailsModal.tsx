import React from 'react';
import type { Course } from '../../types';
import { 
    COMPONENT_NAMES, 
    GRADUATE_ATTRIBUTES,
    EVALUATION_TYPE_NAMES,
    COURSE_TYPE_NAMES,
    MODALITY_NAMES
} from '../../constants';
import MarkdownRenderer from './MarkdownRenderer';

const CourseDetailsModal: React.FC<{ course: Course | null; onClose: () => void, allCourses: Course[], onEdit: (course: Course) => void }> = ({ course, onClose, allCourses, onEdit }) => {
    if (!course) return null;

    const prerequisites = course.prerequisites
        .map(prereqId => {
            const prereqCourse = allCourses.find(c => c.id === prereqId);
            return prereqCourse ? { id: prereqCourse.id, name: prereqCourse.name } : null;
        })
        .filter((c): c is { id: string; name: string } => c !== null);

    const dependentCourses = allCourses
        .filter(c => c.prerequisites.includes(course.id))
        .map(c => ({ id: c.id, name: c.name }));

    const totalHours = course.theoryHours + course.practiceHours + course.labHours + course.seminarHours + course.theoryPracticeHours;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-3xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{course.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">ID: {course.id} | Semestre: {course.semester} | Créditos: {course.credits}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-800 dark:hover:text-white text-3xl leading-none">&times;</button>
                </div>
                <div className="mt-4 space-y-6 text-gray-700 dark:text-gray-300">

                    <div>
                        <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">Información General</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                           <p><strong className="text-gray-800 dark:text-gray-200">Componente:</strong> {COMPONENT_NAMES[course.competencia]}</p>
                           <p><strong className="text-gray-800 dark:text-gray-200">Tipo:</strong> {COURSE_TYPE_NAMES[course.tipoAsignatura]}</p>
                           <p><strong className="text-gray-800 dark:text-gray-200">Grupo Evaluativo:</strong> {EVALUATION_TYPE_NAMES[course.tipoMedicion]}</p>
                           <p><strong className="text-gray-800 dark:text-gray-200">Modalidad:</strong> {MODALITY_NAMES[course.modality]}</p>
                           <p><strong className="text-gray-800 dark:text-gray-200">Área Académica:</strong> {course.areaAcademica || 'No especificada'}</p>
                           <p><strong className="text-gray-800 dark:text-gray-200">Depto. Académico:</strong> {course.academicDepartments.join(', ') || 'No especificado'}</p>
                           
                           <div className="md:col-span-2">
                                <strong className="text-gray-800 dark:text-gray-200 block">Prerrequisitos:</strong>
                                {prerequisites.length > 0 ? (
                                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                                        {prerequisites.map(prereq => (
                                            <li key={prereq.id}>{`${prereq.id} - ${prereq.name}`}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="pl-4 text-sm text-gray-500 dark:text-gray-400 italic">Ninguno</p>
                                )}
                            </div>
                           <div className="md:col-span-2">
                                <strong className="text-gray-800 dark:text-gray-200 block">Habilita a:</strong>
                                {dependentCourses.length > 0 ? (
                                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1">
                                        {dependentCourses.map(dep => (
                                            <li key={dep.id}>{`${dep.id} - ${dep.name}`}</li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="pl-4 text-sm text-gray-500 dark:text-gray-400 italic">Ninguna asignatura</p>
                                )}
                            </div>
                           
                           <p><strong className="text-gray-800 dark:text-gray-200">Créditos Prerreq.:</strong> {course.prerequisiteCredits || '0'}</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">Distribución de Horas Semanales</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                            <p><strong className="text-gray-800 dark:text-gray-200">Teoría:</strong> {course.theoryHours} h</p>
                            <p><strong className="text-gray-800 dark:text-gray-200">Práctica:</strong> {course.practiceHours} h</p>
                            <p><strong className="text-gray-800 dark:text-gray-200">Laboratorio:</strong> {course.labHours} h</p>
                            <p><strong className="text-gray-800 dark:text-gray-200">Seminario:</strong> {course.seminarHours} h</p>
                            <p><strong className="text-gray-800 dark:text-gray-200">Teoría-Práctica:</strong> {course.theoryPracticeHours} h</p>
                            <p className="font-bold"><strong className="text-gray-800 dark:text-gray-200">Total:</strong> {totalHours} h</p>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">Atributos del Graduado</h4>
                        {course.graduateAttributes?.length > 0 ? (
                            <ul className="space-y-2 text-sm">
                                {course.graduateAttributes.map(attrId => (
                                    <li key={attrId}>
                                        <strong className="text-gray-800 dark:text-gray-200">{GRADUATE_ATTRIBUTES[attrId]?.short || attrId}:</strong>
                                        <span className="text-gray-600 dark:text-gray-400 ml-2">{GRADUATE_ATTRIBUTES[attrId]?.long}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className="text-sm text-gray-500">No disponible.</p>}
                    </div>

                    <div>
                        <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">Sumilla</h4>
                        <MarkdownRenderer content={course.sumilla} />
                    </div>
                    
                    <div>
                        <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">Contenidos Específicos</h4>
                        <MarkdownRenderer content={course.contenidoTematico} />
                    </div>
                    
                    <div>
                        <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">Bibliografía de referencia</h4>
                        <MarkdownRenderer content={course.bibliografia} />
                    </div>

                     <div>
                        <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 border-b border-gray-200 dark:border-gray-700 pb-1 mb-2">Evidencias</h4>
                        <MarkdownRenderer content={course.evidence} />
                    </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                    <button
                        onClick={() => {
                            if (course) {
                                onEdit(course);
                                onClose();
                            }
                        }}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                        Editar Asignatura
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CourseDetailsModal;