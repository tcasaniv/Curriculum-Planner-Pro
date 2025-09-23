import React, { useMemo } from 'react';
import type { Course } from '../../types';
import { CourseComponent, CourseType, EvaluationType } from '../../types';
import { COMPONENT_NAMES } from '../../constants';

const TableWrapper: React.FC<{title: string; children: React.ReactNode}> = ({title, children}) => (
    <div className="mb-10">
        <h3 className="text-lg font-semibold mb-4 text-center text-gray-800 dark:text-gray-200 uppercase tracking-wider">{title}</h3>
        <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <table className="min-w-full text-sm text-center text-gray-700 dark:text-gray-300">
                {children}
            </table>
        </div>
    </div>
);

const Th: React.FC<{children: React.ReactNode; colSpan?: number; rowSpan?: number; className?: string}> = ({children, colSpan, rowSpan, className=""}) => (
    <th scope="col" className={`px-2 py-2 font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${className}`} colSpan={colSpan} rowSpan={rowSpan}>{children}</th>
);

const Td: React.FC<{children: React.ReactNode; colSpan?: number; rowSpan?: number; className?: string; isHeader?: boolean}> = ({children, colSpan, rowSpan, className="", isHeader=false}) => (
    <td className={`px-2 py-2 border-t border-r border-gray-200 dark:border-gray-700 last:border-r-0 ${isHeader ? 'font-semibold text-gray-800 dark:text-gray-300 bg-gray-50 dark:bg-gray-800' : ''} ${className}`} colSpan={colSpan} rowSpan={rowSpan}>{children}</td>
);


const StatisticsView: React.FC<{ courses: Course[] }> = ({ courses }) => {
    
    const semesterData = useMemo(() => {
        const data: { 
            [semester: number]: {
                mandatory: { [key in CourseComponent]?: number },
                elective: { [key in CourseComponent]?: number }
            }
        } = {};

        for (let i = 1; i <= 10; i++) {
            data[i] = { mandatory: {}, elective: {} };
        }

        courses.forEach(course => {
            const sem = course.semester;
            if (sem >= 1 && sem <= 10) {
                const type = course.tipoAsignatura === CourseType.Mandatory ? 'mandatory' : 'elective';
                const comp = course.competencia;
                data[sem][type][comp] = (data[sem][type][comp] || 0) + course.credits;
            }
        });

        return data;
    }, [courses]);
    
    const capstoneCourses = useMemo(() => {
        return courses
            .filter(c => c.tipoMedicion === EvaluationType.Capstone)
            .sort((a,b) => a.semester - b.semester);
    }, [courses]);

    const componentData = useMemo(() => {
        const data: { [key in CourseComponent]?: { mandatory: number, elective: number } } = {};
        const components: CourseComponent[] = [CourseComponent.GeneralLearning, CourseComponent.GeneralHumanistic, CourseComponent.Specific, CourseComponent.Specialty];
        
        components.forEach(c => data[c] = {mandatory: 0, elective: 0});

        courses.forEach(course => {
            const comp = course.competencia;
            if(data[comp]) {
                if (course.tipoAsignatura === CourseType.Mandatory) {
                    data[comp]!.mandatory += course.credits;
                } else {
                    data[comp]!.elective += course.credits;
                }
            }
        });
        return Object.entries(data).map(([key, value]) => ({
            component: key as CourseComponent,
            ...value
        })).filter(item => components.includes(item.component));
    }, [courses]);

    if (!courses.length) {
        return <div className="p-6 h-full flex items-center justify-center text-gray-500 dark:text-gray-400">No hay datos para mostrar estadísticas.</div>;
    }

    const componentsToShow: CourseComponent[] = [CourseComponent.GeneralLearning, CourseComponent.GeneralHumanistic, CourseComponent.Specific, CourseComponent.Specialty];
    const academicYears = Array.from({length: 5}, (_, i) => i + 1);

    const totals1 = {
        mandatory: Object.fromEntries(componentsToShow.map(c => [c, 0])) as Record<CourseComponent, number>,
        elective: Object.fromEntries(componentsToShow.map(c => [c, 0])) as Record<CourseComponent, number>,
        semester: 0
    };
    
    for(let i=1; i<=10; i++) {
        let semTotal = 0;
        componentsToShow.forEach(c => {
            const mandatoryCredits = semesterData[i].mandatory[c] || 0;
            const electiveCredits = semesterData[i].elective[c] || 0;
            totals1.mandatory[c] += mandatoryCredits;
            totals1.elective[c] += electiveCredits;
            semTotal += mandatoryCredits + electiveCredits;
        });
        totals1.semester += semTotal;
    }
    
    const totalCreditsObligatory = componentData.reduce((acc, item) => acc + item.mandatory, 0);
    const totalCreditsElective = componentData.reduce((acc, item) => acc + item.elective, 0);

    return (
    <div className="p-6 h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
        <h2 className="text-2xl font-bold mb-8 text-center text-gray-900 dark:text-white">Estadísticas del Plan de Estudios</h2>

        {/* --- Table 1: RESUMEN DE CRÉDITOS POR COMPONENTES --- */}
        <TableWrapper title="Resumen de Créditos por Componentes">
            <thead className="bg-gray-100 dark:bg-gray-700 align-middle">
                <tr>
                    <Th rowSpan={2}>Año Académico</Th>
                    <Th rowSpan={2}>Semestre</Th>
                    <Th colSpan={4}>Cursos Obligatorios</Th>
                    <Th colSpan={4}>Cursos Electivos</Th>
                    <Th rowSpan={2}>Total por Semestre</Th>
                </tr>
                <tr>
                    {componentsToShow.map(c => <Th key={`ob-${c}`}>{c}</Th>)}
                    {componentsToShow.map(c => <Th key={`el-${c}`}>{c}</Th>)}
                </tr>
            </thead>
            <tbody>
                {academicYears.map(year => {
                    const s1 = (year - 1) * 2 + 1;
                    const s2 = (year - 1) * 2 + 2;
                    // FIX: Ensure reduce handles potentially undefined values by coercing to 0.
                    const s1_total = Object.values(semesterData[s1].mandatory).reduce((a,b)=>a+(b||0),0) + Object.values(semesterData[s1].elective).reduce((a,b)=>a+(b||0),0);
                    const s2_total = Object.values(semesterData[s2].mandatory).reduce((a,b)=>a+(b||0),0) + Object.values(semesterData[s2].elective).reduce((a,b)=>a+(b||0),0);
                    return (
                        <React.Fragment key={year}>
                            <tr>
                                <Td rowSpan={2} isHeader>{year}</Td>
                                <Td isHeader>PRIMER</Td>
                                {componentsToShow.map(c => <Td key={`s1-ob-${c}`}>{semesterData[s1].mandatory[c] || 0}</Td>)}
                                {componentsToShow.map(c => <Td key={`s1-el-${c}`}>{semesterData[s1].elective[c] || 0}</Td>)}
                                <Td isHeader>{s1_total}</Td>
                            </tr>
                            <tr>
                                <Td isHeader>SEGUNDO</Td>
                                {componentsToShow.map(c => <Td key={`s2-ob-${c}`}>{semesterData[s2].mandatory[c] || 0}</Td>)}
                                {componentsToShow.map(c => <Td key={`s2-el-${c}`}>{semesterData[s2].elective[c] || 0}</Td>)}
                                <Td isHeader>{s2_total}</Td>
                            </tr>
                        </React.Fragment>
                    )
                })}
            </tbody>
            <tfoot className="bg-gray-100 dark:bg-gray-700 font-bold">
                <tr>
                    <Td colSpan={2}>TOTAL</Td>
                    {componentsToShow.map(c => <Td key={`tot-ob-${c}`}>{totals1.mandatory[c]}</Td>)}
                    {componentsToShow.map(c => <Td key={`tot-el-${c}`}>{totals1.elective[c]}</Td>)}
                    <Td>{totals1.semester}</Td>
                </tr>
            </tfoot>
        </TableWrapper>

        {/* --- Table 2: RESUMEN DE TOPE DE CREDITOS PARA OFERTAR POR SEMESTRE --- */}
        <TableWrapper title="Resumen de Tope de Créditos para Ofertar por Semestre">
             <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                    <Th>Año Académico</Th>
                    <Th>Semestre</Th>
                    <Th>Obligatorios</Th>
                    <Th>Electivos</Th>
                    <Th>Créditos</Th>
                </tr>
            </thead>
            <tbody>
                 {academicYears.map(year => {
                    const s1 = (year - 1) * 2 + 1;
                    const s2 = (year - 1) * 2 + 2;
                    // FIX: Ensure reduce handles potentially undefined values by coercing to 0.
                    const s1_ob = Object.values(semesterData[s1].mandatory).reduce((a,b)=>a+(b||0),0);
                    const s1_el = Object.values(semesterData[s1].elective).reduce((a,b)=>a+(b||0),0);
                    const s2_ob = Object.values(semesterData[s2].mandatory).reduce((a,b)=>a+(b||0),0);
                    const s2_el = Object.values(semesterData[s2].elective).reduce((a,b)=>a+(b||0),0);
                    return (
                        <React.Fragment key={year}>
                        <tr>
                            <Td rowSpan={2} isHeader>{year}</Td>
                            <Td isHeader>PRIMER</Td>
                            <Td>{s1_ob}</Td>
                            <Td>{s1_el}</Td>
                            <Td isHeader>{s1_ob + s1_el}</Td>
                        </tr>
                        <tr>
                            <Td isHeader>SEGUNDO</Td>
                            <Td>{s2_ob}</Td>
                            <Td>{s2_el}</Td>
                            <Td isHeader>{s2_ob + s2_el}</Td>
                        </tr>
                        </React.Fragment>
                    )
                 })}
            </tbody>
             <tfoot className="bg-gray-100 dark:bg-gray-700 font-bold">
                <tr>
                    {/* FIX: Added empty child to Td to satisfy required children prop. */}
                    <Td colSpan={3} className="border-r-0">{''}</Td>
                    <Td>{totalCreditsElective}</Td>
                    <Td>{totalCreditsObligatory + totalCreditsElective}</Td>
                </tr>
            </tfoot>
        </TableWrapper>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {/* --- Table 3.1: ASIGNATURA CAPSTONE --- */}
            <TableWrapper title="Asignatura Capstone">
                 <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                        <Th>N°</Th>
                        <Th className="text-left">Nombre</Th>
                        <Th>Año Acade.</Th>
                        <Th>Semestre</Th>
                    </tr>
                </thead>
                <tbody>
                    {capstoneCourses.length > 0 ? capstoneCourses.map((course, index) => (
                        <tr key={course.id}>
                            <Td isHeader>{index + 1}</Td>
                            <Td className="text-left">{course.name}</Td>
                            <Td>{Math.ceil(course.semester / 2)}</Td>
                            <Td>{course.semester}</Td>
                        </tr>
                    )) : (
                        <tr><Td colSpan={4} className="py-4">No hay asignaturas Capstone.</Td></tr>
                    )}
                </tbody>
            </TableWrapper>
             {/* --- Table 3.2: ASIGNATURA ESPEJO --- */}
            <TableWrapper title="Asignatura Espejo">
                <thead className="bg-gray-100 dark:bg-gray-700">
                    <tr>
                        <Th>N°</Th>
                        <Th className="text-left">Nombre</Th>
                        <Th>Año Acade.</Th>
                        <Th>Semestre</Th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <Td isHeader>1</Td>
                        <Td className="text-left">no establece</Td>
                        {/* FIX: Added empty child to Td to satisfy required children prop. */}
                        <Td>{''}</Td>
                        {/* FIX: Added empty child to Td to satisfy required children prop. */}
                        <Td>{''}</Td>
                    </tr>
                    {/* FIX: Added empty child to Td to satisfy required children prop. This is for table row spacing. */}
                    <tr><Td colSpan={4} className="h-6 border-b-0">{''}</Td></tr>
                    {/* FIX: Added empty child to Td to satisfy required children prop. This is for table row spacing. */}
                    <tr><Td colSpan={4} className="h-6 border-b-0">{''}</Td></tr>
                </tbody>
            </TableWrapper>
        </div>

        {/* --- Table 4: COMPONENTES --- */}
        <TableWrapper title="Componentes">
            <thead className="bg-gray-100 dark:bg-gray-700">
                <tr>
                    <Th className="text-left">Componentes</Th>
                    <Th>Créditos Asigs. Oblig.</Th>
                    <Th>Créditos Asigs. Elect.</Th>
                    <Th>Total de Créditos</Th>
                </tr>
            </thead>
            <tbody>
                {componentData.map(item => (
                    <tr key={item.component}>
                        <Td className="text-left font-semibold">{COMPONENT_NAMES[item.component]}</Td>
                        <Td>{item.mandatory}</Td>
                        <Td>{item.elective}</Td>
                        <Td isHeader>{item.mandatory + item.elective}</Td>
                    </tr>
                ))}
            </tbody>
             <tfoot className="bg-gray-100 dark:bg-gray-700 font-bold">
                <tr>
                    <Td className="text-left">TOTAL</Td>
                    <Td>{totalCreditsObligatory}</Td>
                    <Td>{totalCreditsElective}</Td>
                    <Td>{totalCreditsObligatory + totalCreditsElective}</Td>
                </tr>
            </tfoot>
        </TableWrapper>

    </div>
  );
};

export default StatisticsView;