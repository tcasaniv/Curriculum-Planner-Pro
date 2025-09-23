
import { CourseComponent, EvaluationType, CourseType, HighlightMode, Modality } from './types';

export const COMPONENT_NAMES: Record<CourseComponent, string> = {
  [CourseComponent.A]: 'Formación Básica',
  [CourseComponent.B]: 'Formación Especializada',
  [CourseComponent.C]: 'Formación Profesional y Otros',
  [CourseComponent.GeneralLearning]: 'Est.Gen.: Capacidades de Aprendizaje',
  [CourseComponent.GeneralHumanistic]: 'Est.Gen.: Form.Humanist.Ident. y Ciudadania',
  [CourseComponent.Specific]: 'Estudios Especificos',
  [CourseComponent.Specialty]: 'Estudios de Especialidad',
};

export const COMPONENT_COLORS: Record<CourseComponent, string> = {
  [CourseComponent.A]: 'fill-cyan-600',
  [CourseComponent.B]: 'fill-lime-600',
  [CourseComponent.C]: 'fill-orange-600',
  [CourseComponent.GeneralLearning]: 'fill-sky-600',
  [CourseComponent.GeneralHumanistic]: 'fill-emerald-600',
  [CourseComponent.Specific]: 'fill-amber-600',
  [CourseComponent.Specialty]: 'fill-rose-600',
};

export const EVALUATION_TYPE_NAMES: Record<EvaluationType, string> = {
    [EvaluationType.Regular]: 'Regular',
    [EvaluationType.Control]: 'Control',
    [EvaluationType.Capstone]: 'Capstone',
    [EvaluationType.NotApplicable]: 'No Aplica',
};

export const EVALUATION_TYPE_COLORS: Record<EvaluationType, string> = {
    [EvaluationType.Regular]: 'fill-gray-500',
    [EvaluationType.Control]: 'fill-indigo-500',
    [EvaluationType.Capstone]: 'fill-fuchsia-600',
    [EvaluationType.NotApplicable]: 'fill-zinc-600',
};

export const COURSE_TYPE_NAMES: Record<CourseType, string> = {
    [CourseType.Mandatory]: 'Obligatorio',
    [CourseType.Elective]: 'Electivo',
};

export const COURSE_TYPE_COLORS: Record<CourseType, string> = {
    [CourseType.Mandatory]: 'fill-slate-500',
    [CourseType.Elective]: 'fill-teal-500',
};

export const MODALITY_NAMES: Record<Modality, string> = {
    [Modality.Presential]: 'Presencial',
    [Modality.SemiPresential]: 'Semipresencial',
    [Modality.Virtual]: 'Virtual',
};

export const ACADEMIC_AREAS = {
    GENERAL: 'Estudios generales',
    SPECIFIC: 'Estudios específicos',
    SPECIALTY: 'Estudios de especialidad',
};

export const COMPONENT_TO_ACADEMIC_AREA: Record<CourseComponent, string | null> = {
    [CourseComponent.A]: null,
    [CourseComponent.B]: null,
    [CourseComponent.C]: null,
    [CourseComponent.GeneralLearning]: ACADEMIC_AREAS.GENERAL,
    [CourseComponent.GeneralHumanistic]: ACADEMIC_AREAS.GENERAL,
    [CourseComponent.Specific]: ACADEMIC_AREAS.SPECIFIC,
    [CourseComponent.Specialty]: ACADEMIC_AREAS.SPECIALTY,
};

export const HIGHLIGHT_MODES: { value: HighlightMode; label: string }[] = [
    { value: 'component', label: 'Componente' },
    { value: 'evaluation', label: 'Grupo Evaluativo' },
    { value: 'department', label: 'Departamento Académico' },
    { value: 'type', label: 'Tipo de Asignatura' },
    { value: 'area', label: 'Sección Académica' },
];

export const GRADUATE_ATTRIBUTES: Record<string, { short: string; long: string }> = {
  'AG-01': { short: 'AG 01 - El Profesional y el Mundo', long: 'Analiza y evalúa el impacto de las soluciones a problemas complejos de ingeniería en el desarrollo sostenible de la sociedad, la economía, la sostenibilidad, la salud y la seguridad, los marcos legales y el medio ambiente' },
  'AG-02': { short: 'AG-02 - Ética', long: 'Aplica los principios éticos, la ética profesional y las normas de la práctica de la ingeniería, se adhiere al marco legal pertinente y respeta la diversidad de los grupos humanos.' },
  'AG-03': { short: 'AG-03 - Trabajo Individual y en Equipo', long: 'Se desempeña efectivamente como individuo y como parte de un equipo, en un entorno multidisciplinar, colaborativo e inclusivo, empleando mecanismos de interacción presenciales, remotos y sus combinaciones, estableciendo metas y estrategias para cumplir sus objetivos' },
  'AG-04': { short: 'AG-04 - Comunicación', long: 'Se comunica de forma efectiva en actividades complejas de ingeniería con la comunidad de ingeniería y la sociedad en general, a través de la elaboración y comprensión de informes y documentación de diseño, y a través de la elaboración y realización de presentaciones efectivas, según el público objetivo' },
  'AG-05': { short: 'AG-05 - Gestión de Proyectos', long: 'Aplica los principios de gestión en ingeniería y la toma de decisiones económicas considerando eventuales riesgos, como miembro y líder de un equipo, para gestionar proyectos en entornos multidisciplinarios' },
  'AG-06': { short: 'AG-06 - Aprendizaje a lo largo de la vida', long: 'Reconoce la necesidad y está preparado para: i) aprender de forma independiente y continua, ii) adaptarse a tecnologías nuevas y emergentes, y iii) aplicar el pensamiento crítico en el contexto más amplio de los cambios tecnológicos.' },
  'AG-07': { short: 'AG-07 - Conocimientos de Ingeniería', long: 'Aplica conocimientos de matemáticas, ciencias naturales, computación, y conocimientos fundamentales y especializados de ingeniería para desarrollar soluciones a problemas complejos de ingeniería.' },
  'AG-08': { short: 'AG-08 - Análisis de Problemas', long: 'Identifica, busca información, caracteriza y analiza problemas complejos de ingeniería y su contexto, llegando a conclusiones fundamentadas usando conocimientos de matemáticas, ciencias naturales y ciencias de la ingeniería desde una perspectiva holística para el desarrollo sostenible' },
  'AG-09': { short: 'AG-09 - Diseño y Desarrollo de Soluciones', long: 'Diseña soluciones creativas para problemas complejos de ingeniería y diseña sistemas, componentes o procesos para satisfacer necesidades identificadas dentro de restricciones realistas, según se requiera, de salud y seguridad pública, el costo del ciclo de vida, el cero carbono neto, de recursos, culturales, sociales, económicas y ambientales.' },
  'AG-10': { short: 'AG-10 - Indagación', long: 'Conduce indagaciones de problemas complejos de ingeniería usando métodos de investigación incluyendo conocimiento basado en investigación, design y conducción de experimentos, análisis e interpretación de datos y síntesis de información para producir conclusiones válidas.' },
  'AG-11': { short: 'AG-11 - Uso de Herramientas', long: 'Crea, selecciona, aplica, y reconoce las limitaciones de las técnicas, recursos y herramientas modernas apropiadas de ingeniería y tecnologías de la información, incluyendo la predicción y el modelado, en problemas complejos de ingeniería.' },
};
