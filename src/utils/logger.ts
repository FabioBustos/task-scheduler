import winston from 'winston';
import path from 'path';

// Definir colores personalizados para los niveles de log
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Configurar colores para winston
winston.addColors(colors);

// Formato de logs
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Configuración de transports
const transports = [
  // Consola
  new winston.transports.Console({
    format: logFormat,
    level: 'debug'
  }),
  
  // Archivo de errores
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.json()
    )
  }),
  
  // Archivo de logs combinados
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/combined.log'),
    level: 'info',
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.json()
    )
  })
];

// Crear logger
const logger = winston.createLogger({
  level: 'debug',
  levels,
  transports
});

// Extensión de logger con métodos de traza
export const loggerService = {
  error: (message: string, meta?: any) => logger.error(message, meta),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  info: (message: string, meta?: any) => logger.info(message, meta),
  http: (message: string, meta?: any) => logger.http(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),
  
  // Método para trazar ejecución de tareas
  traceTaskExecution: (task: any, status: string, additionalInfo?: any) => {
    logger.info(`Task Execution: ID ${task.id} - Status: ${status}`, {
      taskId: task.id,
      type: task.type,
      priority: task.priority,
      status,
      ...additionalInfo
    });
  },

  // Método para trazar asignación de workers
  traceWorkerAssignment: (task: any, worker: any) => {
    logger.debug(`Worker Assignment: Task ${task.id} assigned to ${worker.id}`, {
      taskId: task.id,
      workerId: worker.id,
      workerCapacity: worker.capacity
    });
  }
};

export default logger;