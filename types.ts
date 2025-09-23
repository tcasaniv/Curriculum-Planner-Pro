
export enum CourseComponent {
  A = 'A',
  B = 'B',
  C = 'C',
  GeneralLearning = 'D',
  GeneralHumanistic = 'E',
  Specific = 'F',
  Specialty = 'G',
}

export enum EvaluationType {
  Regular = 'REGULAR',
  Control = 'CONTROL',
  Capstone = 'CAPSTONE',
  NotApplicable = 'NOT_APPLICABLE',
}

export enum CourseType {
  Mandatory = 'OBLIGATORIO',
  Elective = 'ELECTIVO',
}

export enum Modality {
  Presential = 'PRESENCIAL',
  SemiPresential = 'SEMIPRESENCIAL',
  Virtual = 'VIRTUAL',
}

export interface Course {
  id: string;
  name: string;
  theoryHours: number;
  practiceHours: number;
  labHours: number;
  seminarHours: number;
  theoryPracticeHours: number;
  credits: number;
  academicDepartments: string[];
  prerequisites: string[];
  prerequisiteCredits: number;
  competencia: CourseComponent;
  semester: number;
  sumilla: string;
  contenidoTematico: string;
  bibliografia: string;
  tipoMedicion: EvaluationType;
  tipoAsignatura: CourseType;
  areaAcademica: string;
  graduateAttributes: string[];
  evidence: string;
  modality: Modality;
}

export type ViewTab = 'flowchart' | 'syllabus' | 'statistics' | 'courseTable';

export type HighlightMode = 'component' | 'evaluation' | 'department' | 'type' | 'area';

export type Theme = 'light' | 'dark' | 'system';

export type InteractionMode = 'navigate' | 'grid' | 'free';

export type ViewMode = 'semester' | 'horizontal';
