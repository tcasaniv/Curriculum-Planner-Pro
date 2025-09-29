
import React, { useState, useMemo, useEffect } from 'react';
import type { Course } from '../../types';
import { GRADUATE_ATTRIBUTES, EVALUATION_TYPE_NAMES, COURSE_TYPE_NAMES, ACADEMIC_AREAS, COMPONENT_TO_ACADEMIC_AREA, MODALITY_NAMES } from '../../constants';
import MarkdownRenderer from '../common/MarkdownRenderer';

const SyllabusView: React.FC<{ courses: Course[] }> = ({ courses }) => {
    const [selectedCourseId, setSelectedCourseId] = useState<string>(courses[0]?.id || '');
    const sortedCourses = useMemo(() => [...courses].sort((a, b) => (a.casi || a.id).localeCompare(b.casi || b.id)), [courses]);

    useEffect(() => {
        if (!selectedCourseId && sortedCourses.length > 0) {
            setSelectedCourseId(sortedCourses[0].id);
        }
         if (selectedCourseId && !courses.find(c => c.id === selectedCourseId)) {
            setSelectedCourseId(sortedCourses[0]?.id || '');
        }
    }, [sortedCourses, selectedCourseId, courses]);

    const selectedCourse = useMemo(() => courses.find(c => c.id === selectedCourseId), [courses, selectedCourseId]);

    const Section: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = "" }) => (
        <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
            <h3 className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-sm font-bold text-gray-800 dark:text-white tracking-wider uppercase">{title}</h3>
            <div className="p-4">{children}</div>
        </div>
    );
    
    const getNature = (course: Course): string => {
        const hasTheory = course.theoryHours > 0;
        const hasPractice = course.practiceHours > 0 || course.labHours > 0;
        if (hasTheory && hasPractice) return 'Teórico y práctico';
        if (hasTheory) return 'Teórico';
        if (hasPractice) return 'Práctico';
        if (course.seminarHours > 0) return 'Seminario';
        return 'No especificado';
    };

    if (!courses.length) return <div className="text-center p-8 text-gray-500 dark:text-gray-400">No hay asignaturas para mostrar.</div>;

    if (!selectedCourse) {
        return (
            <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
                <select onChange={e => setSelectedCourseId(e.target.value)} className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md mb-6" defaultValue="">
                    <option value="" disabled>Seleccione una asignatura...</option>
                    {sortedCourses.map(c => <option key={c.id} value={c.id}>{`${c.casi} - ${c.name}`}</option>)}
                </select>
                <div className="text-center p-8 text-gray-500 dark:text-gray-400">Por favor, seleccione una asignatura para ver sus detalles.</div>
            </div>
        );
    }
    
    const InfoRow: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
        <tr className="border-t border-gray-200 dark:border-gray-700">
            <td className="px-4 py-2 font-semibold text-gray-500 dark:text-gray-400 align-top">{label}</td>
            <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{value}</td>
        </tr>
    );

    const CheckmarkRow: React.FC<{ label: string; options: string[]; selected: string | null }> = ({ label, options, selected }) => (
        <tr className="border-t border-gray-200 dark:border-gray-700">
            <td className="px-4 py-2 font-semibold text-gray-500 dark:text-gray-400 align-top">{label}</td>
            <td className="px-4 py-2 text-gray-800 dark:text-gray-200">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                    {options.map(option => (
                         <div key={option} className="flex items-center space-x-2">
                            <span className="inline-block w-5 h-5 border border-gray-400 dark:border-gray-500 text-center font-bold leading-tight">
                                {option === selected ? 'X' : <>&nbsp;</>}
                            </span>
                            <span>{option}</span>
                        </div>
                    ))}
                </div>
            </td>
        </tr>
    );
        
    const prerequisitesNames = selectedCourse.prerequisites
        .map(prereqId => courses.find(c => c.id === prereqId))
        .filter(Boolean)
        .map(c => `${c!.casi} - ${c!.name}`)
        .join('; ') || 'Ninguno';
        
    const areaCurricular = COMPONENT_TO_ACADEMIC_AREA[selectedCourse.competencia];

    return (
        <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
            <select value={selectedCourseId} onChange={e => setSelectedCourseId(e.target.value)} className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md mb-6">
                {sortedCourses.map(c => <option key={c.id} value={c.id}>{`${c.casi} - ${c.name}`}</option>)}
            </select>

            <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <h3 className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-sm font-bold text-gray-900 dark:text-white tracking-wider uppercase">
                        {`${selectedCourse.casi} - ${selectedCourse.name}`}
                    </h3>
                    <table className="w-full text-sm text-left table-fixed">
                        <colgroup>
                            <col style={{width: '30%'}} />
                            <col style={{width: '70%'}} />
                        </colgroup>
                        <tbody>
                            <InfoRow label="Horas Teóricas" value={selectedCourse.theoryHours} />
                            <InfoRow label="Horas Prácticas" value={selectedCourse.practiceHours} />
                            <InfoRow label="Horas Laboratorio" value={selectedCourse.labHours} />
                            <InfoRow label="Horas Seminario" value={selectedCourse.seminarHours} />
                            <InfoRow label="Créditos" value={selectedCourse.credits} />
                            <InfoRow label="Departamento académico" value={selectedCourse.academicDepartments.join(', ') || 'No especificado'} />
                            <InfoRow label="Prerrequisito" value={prerequisitesNames} />
                            <InfoRow label="Créditos acumulados" value={selectedCourse.prerequisiteCredits} />
                            <CheckmarkRow label="Tipo de asignatura" options={Object.values(COURSE_TYPE_NAMES)} selected={COURSE_TYPE_NAMES[selectedCourse.tipoAsignatura]} />
                            <CheckmarkRow label="Área curricular" options={Object.values(ACADEMIC_AREAS)} selected={areaCurricular} />
                            <InfoRow label="Sección académica" value={selectedCourse.areaAcademica || 'No especificada'} />
                            <CheckmarkRow label="Grupo evaluativo" options={Object.values(EVALUATION_TYPE_NAMES)} selected={EVALUATION_TYPE_NAMES[selectedCourse.tipoMedicion]} />
                            <InfoRow label="Naturaleza" value={getNature(selectedCourse)} />
                            <CheckmarkRow label="Modalidad" options={Object.values(MODALITY_NAMES)} selected={MODALITY_NAMES[selectedCourse.modality]} />
                        </tbody>
                    </table>
                </div>

                <Section title="Atributos del Graduado">
                    {selectedCourse.graduateAttributes?.length > 0 ? (
                        <ul className="space-y-3 text-sm">
                            {selectedCourse.graduateAttributes.map(attrId => (
                                <li key={attrId} className="flex flex-col">
                                    <strong className="text-gray-800 dark:text-gray-200">{GRADUATE_ATTRIBUTES[attrId]?.short || attrId}</strong>
                                    <span className="text-gray-600 dark:text-gray-400 mt-1">{GRADUATE_ATTRIBUTES[attrId]?.long}</span>
                                </li>
                            ))}
                        </ul>
                    ) : <p className="text-sm text-gray-500">No disponible.</p>}
                </Section>

                <Section title="Sumilla">
                    <MarkdownRenderer content={selectedCourse.sumilla} />
                </Section>

                <Section title="Contenidos específicos">
                    <MarkdownRenderer content={selectedCourse.contenidoTematico} />
                </Section>

                <Section title="Evidencias">
                    <MarkdownRenderer content={selectedCourse.evidence} />
                </Section>

                <Section title="Bibliografía de referencia">
                    <MarkdownRenderer content={selectedCourse.bibliografia} />
                </Section>
            </div>
        </div>
    );
};

export default SyllabusView;
