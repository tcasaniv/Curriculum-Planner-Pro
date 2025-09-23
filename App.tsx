import React, { useState, useCallback, useEffect } from 'react';
import type { Course, Theme } from './types';
import { CourseComponent, CourseType, EvaluationType, Modality } from './types';
import { processImportedData } from './utils';
import MenuBar from './components/MenuBar';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import InfoModal from './components/common/InfoModal';
import ConfirmationModal from './components/common/ConfirmationModal';
import QuickStartGuide from './components/QuickStartGuide';
import CourseFormModal from './components/CourseFormModal';


const App: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLeftPanelVisible, setIsLeftPanelVisible] = useState(false);
  const [isRightPanelVisible, setIsRightPanelVisible] = useState(false);
  const [modal, setModal] = useState<{
    type: 'info' | 'confirm', 
    title: string, 
    content: React.ReactNode, 
    onConfirm?: () => void,
    confirmText?: string;
    confirmClass?: string;
  } | null>(null);
  const [projectName, setProjectName] = useState('plan_de_estudios');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'system');

  // State for course form modal
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = () => {
        const isDark =
            theme === 'dark' ||
            (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    };
    
    applyTheme();
    localStorage.setItem('theme', theme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
        if (theme === 'system') {
            applyTheme();
        }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const handleNew = useCallback(() => {
    setModal({
        type: 'confirm',
        title: 'Crear Nuevo Plan',
        content: '¿Está seguro de que desea crear un nuevo plan de estudios? Los cambios no guardados se perderán.',
        onConfirm: () => {
             setCourses([]);
             setProjectName('plan_de_estudios_nuevo');
             setIsLeftPanelVisible(true);
             setIsRightPanelVisible(true);
        }
    });
  }, []);

  const handleImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result;
          if (typeof text === 'string') {
            const json = JSON.parse(text);
            const processedCourses = processImportedData(json);
            setCourses(processedCourses);
            const fileName = file.name.split('.').slice(0, -1).join('.');
            setProjectName(fileName || 'plan_importado');
            setIsLeftPanelVisible(true);
            setIsRightPanelVisible(true);
          }
        } catch (error) {
          console.error("Error parsing JSON file:", error);
          setModal({
              type: 'info',
              title: 'Error de Importación',
              content: 'Error al leer el archivo JSON. Asegúrese de que el formato sea correcto y el archivo no esté dañado.'
          });
        }
      };
      reader.readAsText(file);
    }
    event.target.value = ''; // Reset input
  }, []);

  const handleExport = useCallback(() => {
    if (courses.length === 0) {
        setModal({
            type: 'info',
            title: 'Exportación Vacía',
            content: 'No hay datos en el plan de estudios actual para exportar.'
        });
        return;
    }
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(courses, null, 2))}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `${projectName}.json`;
    link.click();
  }, [courses, projectName]);

  const handleShowGuide = () => {
      setModal({
          type: 'info',
          title: 'Guía Rápida',
          content: (
              <div className="text-left space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    Esta herramienta le permite diseñar, visualizar y analizar planes de estudio.
                  </p>
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                    <li><strong className="text-indigo-600 dark:text-indigo-400">Archivo > Nuevo:</strong> Comienza un plan de estudios desde cero.</li>
                    <li><strong className="text-indigo-600 dark:text-indigo-400">Archivo > Importar JSON:</strong> Carga un plan de estudios desde un archivo.</li>
                    <li><strong className="text-indigo-600 dark:text-indigo-400">Ver:</strong> Muestra u oculta los paneles laterales y cambia el tema.</li>
                    <li><strong className="text-indigo-600 dark:text-indigo-400">Panel Izquierdo:</strong> Añade, edita o elimina las asignaturas de tu plan.</li>
                    <li><strong className="text-indigo-600 dark:text-indigo-400">Panel Derecho:</strong> Visualiza la Malla Curricular, explora las Sumillas o revisa las Estadísticas.</li>
                  </ul>
              </div>
          )
      });
  };

  const handleShowAbout = () => {
    setModal({
        type: 'info',
        title: 'Acerca de Curriculum Planner Pro',
        content: (
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <p>Versión 1.1.0</p>
                <p>Una herramienta avanzada para el diseño y visualización de planes de estudio universitarios.</p>
                <p>&copy; 2024. Todos los derechos reservados.</p>
            </div>
        )
    });
  };

  // --- Course CRUD Handlers ---
  const handleSaveCourse = (course: Course) => {
    setCourses(prev => {
        const index = prev.findIndex(c => c.id === course.id);
        if (index > -1) {
            const newCourses = [...prev];
            newCourses[index] = course;
            return newCourses;
        } else {
            return [...prev, course];
        }
    });
    setIsFormModalOpen(false);
    setEditingCourse(null);
  };

  const handleAddCourse = () => {
    setEditingCourse({
        id: '', name: '', credits: 0, semester: 1, academicDepartments: [], competencia: CourseComponent.Specific,
        prerequisites: [], sumilla: '', tipoAsignatura: CourseType.Mandatory, tipoMedicion: EvaluationType.Regular,
        areaAcademica: '', contenidoTematico: '', bibliografia: '', labHours: 0, practiceHours: 0, prerequisiteCredits: 0,
        seminarHours: 0, theoryHours: 0, theoryPracticeHours: 0, graduateAttributes: [], evidence: '', modality: Modality.Presential
    });
    setIsFormModalOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setIsFormModalOpen(true);
  };

  const confirmDelete = (courseId: string) => {
    setCourses(prev => prev.filter(c => c.id !== courseId)
        .map(c => ({...c, prerequisites: c.prerequisites.filter(p => p !== courseId)}))
    );
  };

  const handleDeleteRequest = (courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    setModal({
        type: 'confirm',
        title: 'Confirmar Eliminación',
        content: `¿Está seguro de que desea eliminar la asignatura "${course?.name || courseId}"? Esta acción no se puede deshacer.`,
        onConfirm: () => confirmDelete(courseId),
        confirmText: "Eliminar",
        confirmClass: "bg-red-600 hover:bg-red-500"
    });
  };

  const showQuickStart = !isLeftPanelVisible && !isRightPanelVisible;

  return (
    <div className="h-screen w-screen flex flex-col font-sans bg-gray-100 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <MenuBar
        onNew={handleNew}
        onImport={handleImport}
        onExport={handleExport}
        onToggleLeftPanel={() => setIsLeftPanelVisible(v => !v)}
        onToggleRightPanel={() => setIsRightPanelVisible(v => !v)}
        isLeftPanelVisible={isLeftPanelVisible}
        isRightPanelVisible={isRightPanelVisible}
        onShowGuide={handleShowGuide}
        onShowAbout={handleShowAbout}
        projectName={projectName}
        onProjectNameChange={setProjectName}
        theme={theme}
        onThemeChange={setTheme}
      />
      <main className="flex-grow flex overflow-hidden">
        {showQuickStart ? (
          <QuickStartGuide />
        ) : (
          <>
            {isLeftPanelVisible && (
              <aside className={`transition-all duration-300 ${isRightPanelVisible ? 'w-1/3' : 'w-full'}`}>
                <LeftPanel 
                    courses={courses} 
                    onAddCourse={handleAddCourse}
                    onEditCourse={handleEditCourse}
                    onDeleteCourse={handleDeleteRequest}
                />
              </aside>
            )}
            {isRightPanelVisible && (
              <section className={`transition-all duration-300 ${isLeftPanelVisible ? 'w-2/3' : 'w-full'}`}>
                <RightPanel courses={courses} onEditCourse={handleEditCourse} />
              </section>
            )}
          </>
        )}
      </main>

      {isFormModalOpen && (
        <CourseFormModal 
            isOpen={isFormModalOpen}
            onClose={() => setIsFormModalOpen(false)}
            onSave={handleSaveCourse}
            course={editingCourse}
            allCourses={courses}
        />
      )}

      {modal && (modal.type === 'info' 
        ? <InfoModal title={modal.title} onClose={() => setModal(null)}>{modal.content}</InfoModal>
        : <ConfirmationModal 
            title={modal.title} 
            onClose={() => setModal(null)} 
            onConfirm={() => { modal.onConfirm?.(); setModal(null); }}
            confirmText={modal.confirmText}
            confirmClass={modal.confirmClass}
          >
              {modal.content}
          </ConfirmationModal>
      )}
    </div>
  );
};

export default App;