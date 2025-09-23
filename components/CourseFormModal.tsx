import React, { useState } from 'react';
import type { Course } from '../types';
import { CourseComponent, CourseType, EvaluationType, Modality } from '../types';
import { GRADUATE_ATTRIBUTES, COMPONENT_NAMES, MODALITY_NAMES } from '../constants';

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Course) => void;
  course: Course | null;
  allCourses: Course[];
}

const CourseFormModal: React.FC<CourseFormModalProps> = ({ isOpen, onClose, onSave, course, allCourses }) => {
    const [formData, setFormData] = useState<Course | null>(course);
    const [prereqSearch, setPrereqSearch] = useState('');
    const [tooltip, setTooltip] = useState<{ content: React.ReactNode; x: number; y: number } | null>(null);


    React.useEffect(() => {
        setFormData(course);
    }, [course]);

    if (!isOpen || !formData) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const finalValue = (e.target as HTMLInputElement).type === 'number' ? parseFloat(value) || 0 : value;
        setFormData(prev => prev ? { ...prev, [name]: finalValue } as Course : null);
    };
    
    const handlePrereqChange = (courseId: string, isChecked: boolean) => {
        setFormData(prev => {
            if (!prev) return null;
            const currentPrereqs = prev.prerequisites || [];
            if (isChecked) {
                return { ...prev, prerequisites: [...currentPrereqs, courseId] };
            } else {
                return { ...prev, prerequisites: currentPrereqs.filter(id => id !== courseId) };
            }
        });
    };
    
    const handleAttributeChange = (attributeId: string, isChecked: boolean) => {
        setFormData(prev => {
            if (!prev) return null;
            const currentAttrs = prev.graduateAttributes || [];
            if (isChecked) {
                return { ...prev, graduateAttributes: [...currentAttrs, attributeId] };
            } else {
                return { ...prev, graduateAttributes: currentAttrs.filter(id => id !== attributeId) };
            }
        });
    };

    const handleSave = () => {
        if(formData) onSave(formData);
    };

    const handleMouseLeave = () => {
        setTooltip(null);
    };

    const handlePrereqMouseEnter = (courseToShow: Course, event: React.MouseEvent) => {
        const prereqNames = courseToShow.prerequisites
            .map(pId => allCourses.find(c => c.id === pId)?.name)
            .filter(Boolean)
            .join(', ') || 'Ninguno';
            
        const content = (
            <div className="space-y-1">
                <h4 className="font-bold text-indigo-400">{courseToShow.name}</h4>
                <p><strong className="text-gray-400">Sumilla:</strong> {courseToShow.sumilla.substring(0, 100)}...</p>
                <p><strong className="text-gray-400">Créditos:</strong> {courseToShow.credits}</p>
                <p><strong className="text-gray-400">Atributos:</strong> {courseToShow.graduateAttributes.join(', ') || 'N/A'}</p>
                <p><strong className="text-gray-400">Componente:</strong> {COMPONENT_NAMES[courseToShow.competencia]}</p>
                <p><strong className="text-gray-400">Prerreq.:</strong> {prereqNames}</p>
                <p><strong className="text-gray-400">Área Académica:</strong> {courseToShow.areaAcademica || 'N/A'}</p>
            </div>
        );

        setTooltip({ content, x: event.clientX, y: event.clientY });
    };

    const handleAttributeMouseEnter = (attributeId: string, event: React.MouseEvent) => {
        const attribute = GRADUATE_ATTRIBUTES[attributeId];
        if (!attribute) return;

        const measuringCourses = allCourses.filter(c => c.graduateAttributes.includes(attributeId));
        const semesterCounts = measuringCourses.reduce((acc, course) => {
            acc[course.semester] = (acc[course.semester] || 0) + 1;
            return acc;
        }, {} as Record<number, number>);
        
        const semesterDistribution = Object.entries(semesterCounts)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([sem, count]) => `Sem ${sem}: ${count}`)
            .join(' | ');

        const content = (
            <div className="space-y-1">
                <h4 className="font-bold text-indigo-400">{attribute.short}</h4>
                <p className="text-gray-300">{attribute.long}</p>
                <div className="mt-2 pt-2 border-t border-gray-600">
                    <p><strong className="text-gray-400">Total de cursos que lo miden:</strong> {measuringCourses.length}</p>
                    {measuringCourses.length > 0 && <p><strong className="text-gray-400">Distribución:</strong> {semesterDistribution}</p>}
                </div>
            </div>
        );
        
        setTooltip({ content, x: event.clientX, y: event.clientY });
    };
    
    const formElementClasses = "bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 p-2 rounded w-full focus:ring-1 focus:ring-indigo-500 focus:outline-none";

    const FormInput: React.FC<{ label: string; name: string; value: string | number; onChange: any; type?: string; className?: string; placeholder?: string; }> = 
        ({ label, name, value, onChange, type = "text", className = "", placeholder="" }) => (
        <div className={className}>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <input id={name} className={formElementClasses} name={name} value={value} onChange={onChange} type={type} placeholder={placeholder} />
        </div>
    );
    
    const FormSelect: React.FC<{ label: string; name: string; value: string; onChange: any; children: React.ReactNode; }> =
        ({ label, name, value, onChange, children }) => (
        <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
            <select id={name} className={formElementClasses} name={name} value={value} onChange={onChange}>{children}</select>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            {tooltip && (
                <div 
                    className="fixed bg-gray-900 border border-indigo-500 text-white p-3 rounded-lg shadow-2xl z-[60] pointer-events-none text-xs" 
                    style={{ top: tooltip.y + 15, left: tooltip.x + 15, maxWidth: '400px' }}
                >
                    {tooltip.content}
                </div>
            )}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{course?.id ? 'Editar Asignatura' : 'Nueva Asignatura'}</h2>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-800 dark:hover:text-white text-3xl leading-none font-bold focus:outline-none" 
                        aria-label="Cerrar"
                    >
                        &times;
                    </button>
                </div>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <FormInput label="ID" name="id" value={formData.id} onChange={handleChange} className="md:col-span-1" />
                        <FormInput label="Nombre" name="name" value={formData.name} onChange={handleChange} className="md:col-span-3" />
                        <FormInput label="Créditos" name="credits" type="number" value={formData.credits} onChange={handleChange} />
                        <FormInput label="Semestre" name="semester" type="number" value={formData.semester} onChange={handleChange} />
                        <FormInput label="Créditos de Prerrequisito" name="prerequisiteCredits" type="number" value={formData.prerequisiteCredits} onChange={handleChange} />
                        <FormInput label="Área Académica" name="areaAcademica" value={formData.areaAcademica} onChange={handleChange} />
                         <FormInput label="Departamentos Académicos" name="academicDepartments" value={formData.academicDepartments.join(', ')} onChange={e => setFormData(f => f ? {...f, academicDepartments: e.target.value.split(',').map(s => s.trim())} : null)} placeholder="Depto1, Depto2" className="md:col-span-2"/>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormInput label="Horas Teoría" name="theoryHours" type="number" value={formData.theoryHours} onChange={handleChange} />
                        <FormInput label="Horas Práctica" name="practiceHours" type="number" value={formData.practiceHours} onChange={handleChange} />
                        <FormInput label="Horas Lab" name="labHours" type="number" value={formData.labHours} onChange={handleChange} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                         <FormSelect label="Componente" name="competencia" value={formData.competencia} onChange={handleChange}>
                            {Object.entries(COMPONENT_NAMES).map(([key, name]) => <option key={key} value={key as CourseComponent}>{`${key} - ${name}`}</option>)}
                        </FormSelect>
                        <FormSelect label="Tipo Asignatura" name="tipoAsignatura" value={formData.tipoAsignatura} onChange={handleChange}>
                            {Object.values(CourseType).map(t => <option key={t} value={t}>{t}</option>)}
                        </FormSelect>
                         <FormSelect label="Grupo Evaluativo" name="tipoMedicion" value={formData.tipoMedicion} onChange={handleChange}>
                            {Object.values(EvaluationType).map(t => <option key={t} value={t}>{t}</option>)}
                        </FormSelect>
                         <FormSelect label="Modalidad" name="modality" value={formData.modality} onChange={handleChange}>
                            {Object.values(Modality).map(m => <option key={m} value={m}>{MODALITY_NAMES[m]}</option>)}
                        </FormSelect>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prerrequisitos</label>
                        <input type="text" placeholder="Buscar asignatura..." value={prereqSearch} onChange={e => setPrereqSearch(e.target.value)} className={`${formElementClasses} mb-2`} />
                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded w-full max-h-32 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {allCourses
                                .filter(c => c.id !== formData.id && c.name.toLowerCase().includes(prereqSearch.toLowerCase()))
                                .map(c => (
                                <div
                                    key={c.id}
                                    onMouseEnter={(e) => handlePrereqMouseEnter(c, e)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <label className="flex items-center space-x-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm cursor-pointer">
                                        <input type="checkbox" checked={formData.prerequisites.includes(c.id)} onChange={(e) => handlePrereqChange(c.id, e.target.checked)} className="form-checkbox bg-gray-200 dark:bg-gray-800 border-gray-400 dark:border-gray-600 text-indigo-500 focus:ring-indigo-500" />
                                        <span>{c.name}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Atributos del Graduado</label>
                        <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded w-full max-h-32 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                             {Object.entries(GRADUATE_ATTRIBUTES).map(([id, attr]) => (
                                <div
                                    key={id}
                                    onMouseEnter={(e) => handleAttributeMouseEnter(id, e)}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <label className="flex items-center space-x-2 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-sm cursor-pointer">
                                        <input type="checkbox" checked={formData.graduateAttributes.includes(id)} onChange={e => handleAttributeChange(id, e.target.checked)} className="form-checkbox bg-gray-200 dark:bg-gray-800 border-gray-400 dark:border-gray-600 text-indigo-500 focus:ring-indigo-500" />
                                        <span>{attr.short}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sumilla</label>
                        <textarea className={`${formElementClasses} font-mono text-sm`} name="sumilla" value={formData.sumilla} onChange={handleChange} rows={4}></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contenidos específicos</label>
                        <textarea className={`${formElementClasses} font-mono text-sm`} name="contenidoTematico" value={formData.contenidoTematico} onChange={handleChange} rows={8}></textarea>
                    </div>

                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Evidencias</label>
                        <textarea className={formElementClasses} name="evidence" value={formData.evidence} onChange={handleChange} rows={3}></textarea>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bibliografía de referencia</label>
                        <textarea className={`${formElementClasses} font-mono text-sm`} name="bibliografia" value={formData.bibliografia} onChange={handleChange} rows={5}></textarea>
                    </div>

                </div>
                <div className="flex justify-end space-x-4 mt-8">
                    <button onClick={onClose} className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">Cancelar</button>
                    <button onClick={handleSave} className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-bold">Guardar</button>
                </div>
            </div>
        </div>
    );
};

export default CourseFormModal;