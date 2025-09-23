import React from 'react';

const QuickStartGuide: React.FC = () => (
    <div className="flex-grow flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center p-8 max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-2xl">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Bienvenido a Curriculum Planner Pro</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          Una herramienta poderosa para diseñar, visualizar y analizar planes de estudio universitarios.
        </p>
        <div className="text-left space-y-4">
          <p className="text-gray-500 dark:text-gray-400">
            <strong className="text-indigo-600 dark:text-indigo-400">Para comenzar:</strong>
          </p>
          <ul className="list-disc list-inside text-gray-500 dark:text-gray-400 space-y-2">
            <li>Navega a <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Archivo &gt; Nuevo</code> para iniciar un plan de estudios en blanco.</li>
            <li>O bien, ve a <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Archivo &gt; Importar JSON...</code> para cargar un plan de estudios existente.</li>
            <li>Usa el menú <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Ver</code> para mostrar y ocultar los paneles de edición y visualización.</li>
          </ul>
        </div>
      </div>
    </div>
);

export default QuickStartGuide;