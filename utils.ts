
import { Course, CourseComponent, CourseType, EvaluationType, Modality } from './types';

export const romanize = (num: number): string => {
    const lookup: { [key: string]: number } = { M: 1000, CM: 900, D: 500, CD: 400, C: 100, XC: 90, L: 50, XL: 40, X: 10, IX: 9, V: 5, IV: 4, I: 1 };
    let roman = '';
    for (let i in lookup) {
        while (num >= lookup[i]) {
            roman += i;
            num -= lookup[i];
        }
    }
    return roman;
}

export const processImportedData = (data: any[]): Course[] => {
    return data.map(item => {
        const idStr = String(item.id);
        const year = parseInt(idStr.substring(3, 4), 10);
        const semesterInYear = parseInt(idStr.substring(4, 5), 10);
        const semester = (year - 1) * 2 + semesterInYear;

        const contenidoTematicoStr = Array.isArray(item.contenidoTematico)
            ? item.contenidoTematico.map((unit: any) => {
                const topic = unit.topic ? `# ${unit.topic}` : '';
                const subtopics = Array.isArray(unit.subtopics) ? unit.subtopics.map((sub: string) => `- ${sub}`).join('\n') : '';
                return `${topic}\n${subtopics}`.trim();
            }).join('\n\n')
            : (item.contenidoTematico || '');

        return {
            id: item.id,
            casi: item.casi || item.id,
            name: item.name,
            theoryHours: item.theoryHours || 0,
            practiceHours: item.practiceHours || 0,
            labHours: item.labHours || 0,
            seminarHours: item.seminarHours || 0,
            theoryPracticeHours: item.theoryPracticeHours || 0,
            credits: item.credits || 0,
            academicDepartments: item.academicDepartments || [],
            prerequisites: item.prerequisites || [],
            prerequisiteCredits: item.prerequisiteCredits || 0,
            competencia: item.competencia || CourseComponent.Specific,
            semester: isNaN(semester) ? 1 : semester,
            sumilla: item.sumilla || '',
            contenidoTematico: contenidoTematicoStr,
            tipoMedicion: item.tipoMedicion || EvaluationType.Regular,
            tipoAsignatura: item.name.includes('(E)') ? CourseType.Elective : CourseType.Mandatory,
            areaAcademica: item.areaAcademica || '',
            graduateAttributes: item.graduateAttributes || [],
            evidence: item.evidence || '',
            bibliografia: item.bibliografia || '',
            modality: item.modality || Modality.Presential,
        };
    });
};
