# Task Scheduler

## Descripción
Sistema avanzado de scheduling de tareas con soporte para priorización, reintentos y asignación dinámica.

## Requisitos Previos
- Node.js 16+
- npm 8+

## Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/task-scheduler.git

# Instalar dependencias
cd task-scheduler
npm install
```

## Scripts Disponibles

- `npm start`: Ejecuta la aplicación
- `npm run dev`: Modo desarrollo con recarga automática
- `npm test`: Ejecuta pruebas unitarias
- `npm run build`: Compila TypeScript a JavaScript
- `npm run lint`: Verifica código con ESLint

## Ejecución de Ejemplo

```typescript
import { TaskSchedulerService } from './services/task-scheduler.service';
import { TaskModel, TaskPriority, TaskType } from './models/task.model';

const workers = [
  { id: 'worker1', capacity: 3 },
  { id: 'worker2', capacity: 3 },
  { id: 'worker3', capacity: 3 },
];

const tasks = [
  new TaskModel(1, 50, TaskPriority.HIGH, TaskType.CPU),
  new TaskModel(2, 30, TaskPriority.MEDIUM, TaskType.IO),
  new TaskModel(3, 70, TaskPriority.HIGH, TaskType.CPU)
];

const scheduler = new TaskSchedulerService(workers);
scheduler.scheduleTasks(tasks)
  .then(result => console.log(result))
  .catch(error => console.error(error));
```

## Estrategia de Scheduling
- Priorización de tareas (HIGH > MEDIUM > LOW)
- Máximo 3 reintentos por tarea
- Asignación dinámica de workers
- Manejo de fallos transitorios

## Consideraciones de Escalabilidad
- Logging centralizado
- Gestión de errores
- Diseño modular para fácil extensión

## Contribuciones
Por favor, lee CONTRIBUTING.md para detalles sobre nuestro código de conducta.

## Licencia
MIT
```

## Pasos de Implementación

1. **Preparación del Proyecto**
```bash
mkdir task-scheduler
cd task-scheduler
npm init -y
npm install typescript ts-node @types/node --save-dev
npx tsc --init
```

2. **Instalación de Dependencias**
```bash
npm install winston jest ts-jest @types/jest eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install --save-dev husky
npx husky install
```

3. **Configuración Git**
```bash
git init
echo "node_modules/" > .gitignore
git add .
git commit -m "Configuración inicial del proyecto"
```

4. **Ejecutar Tests**
```bash
npm test
```

## Puntos Importantes
- Arquitectura modular
- Alta cobertura de tests
- Logging robusto
- Manejo de errores
- Flexibilidad de scheduling

¿Te gustaría que profundice en algún aspecto específico de la implementación?