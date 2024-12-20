# Análisis de eficiencia técnica por estrategia de asignación de tareas

## Introducción al problema

### Contexto y desafío

En el mundo del desarrollo de software y sistemas distribuidos, uno de los desafíos más frecuentes es la distribución eficiente de tareas entre recursos limitados. Este documento describe una solución para el problema de asignar un conjunto de tareas a un número limitado de trabajadores, optimizando el rendimiento total. Las tareas se caracterizan por un ID, costo (ms), prioridad (alta, media, baja) y tipo (CPU o IO). Los trabajadores tienen una capacidad limitada de ejecución simultánea. La solución considera el manejo de fallos, reintentos y un mecanismo de caché para mejorar la eficiencia. Esta versión implementa la solución en TypeScript. Este problema se vuelve especialmente complejo cuando consideramos variables como:

*   Diferentes tipos de tareas (CPU/IO)
*   Prioridades variables
*   Recursos limitados (trabajadores)
*   Fallos potenciales
*   Necesidad de optimización continua

El sistema debe manejar estas variables mientras mantiene un alto rendimiento y una utilización eficiente de recursos. Es un ejemplo clásico del problema de asignación de recursos en sistemas distribuidos, pero con características específicas que lo hacen único.

### Impacto del problema

Las implicaciones de una mala solución pueden ser significativas:

*   Tiempos de respuesta lentos
*   Recursos subutilizados
*   Tareas críticas retrasadas
*   Sobrecarga en algunos trabajadores mientras otros están inactivos
*   Fallos en cascada
*   Reintentos en casos de fallos

## Análisis de eficiencia técnica por estrategia

Para resolver el problema de asignación de tareas hay varias perpectivas las cuales podemos ver a continuación:

### 1. Round Robin (asignación circular)

#### Complejidad temporal

*   **Asignación de tarea:** O(1)
*   **Ciclo completo:** O(n) donde *n* es el número de trabajadores
*   **Mantenimiento del estado:** O(1)

#### Complejidad espacial

*   **Estado del sistema:** O(w) donde *w* es el número de trabajadores
*   **Cola de tareas:** O(t) donde *t* es el número de tareas pendientes

#### Eficiencia para diferentes escalas

*   **Escala pequeña** (< 100 tareas, < 10 trabajadores)
    *   Muy eficiente
    *   Gastos administrativos mínimo
    *   Fácil de depurar
*   **Escala media** (100-1000 tareas, 10-50 trabajadores)
    *   Rendimiento aceptable
    *   Puede generar desbalances temporales
*   **Escala grande** (> 1000 tareas, > 50 trabajadores)
    *   Puede generar desbalances significativos
    *   No considera eficientemente la carga real

### 2. Least Load (Menor carga)

#### Complejidad temporal

*   **Asignación de tarea:** O(w) donde *w* es el número de trabajadores
*   **Actualización de estado:** O(1)
*   **Selección de worker:** O(w log w) con ordenamiento (se podría optimizar a O(w) con una estructura de datos adecuada como un heap o una lista ordenada)

#### Complejidad espacial

*   **Estado del sistema:** O(w)
*   **Estructuras de seguimiento:** O(w + t)

#### Eficiencia para diferentes escalas

*   **Escala Pequeña**
    *   Gastos administrativos puede superar beneficios
    *   Excelente distribución de carga
*   **Escala Media**
    *   Balance óptimo entre gastos administrativos y beneficios
    *   Mejor distribución que Round Robin
*   **Escala Grande**
    *   Gastos administrativos significativo en selección de worker
    *   Requiere optimizaciones adicionales (como almacenamiento en caché de estados)

### 3. Random Assignment (Asignación Aleatoria)

#### Complejidad temporal

*   **Asignación de tarea:** O(1)
*   **Selección de worker:** O(1)
*   **Mantenimiento:** O(1)

#### Complejidad espacial

*   **Estado base:** O(w)
*   **Sin estructuras adicionales:** O(1)

#### Eficiencia para diferentes escalas

*   **Escala pequeña**
    *   Alta variabilidad en resultados
    *   Puede generar distribuciones muy desiguales
*   **Escala media**
    *   Resultados más predecibles
    *   Distribución estadísticamente más uniforme
*   **Escala grande**
    *   Distribución cercana a uniforme
    *   Buen rendimiento sin gastos administrativos

### 4. Priority-Based (Basado en Prioridades)

#### Complejidad temporal

*   **Inserción:** O(log n) con cola de prioridad (donde n es el número de tareas en la cola)
*   **Extracción:** O(log n)
*   **Actualización de prioridades:** O(log n)

#### Complejidad espacial

*   **Cola de prioridad:** O(t)
*   **Estado de trabajadores:** O(w)
*   **Estructuras de tracking:** O(w + t)

#### Eficiencia para diferentes escalas

*   **Escala pequeña**
    *   Gastos administrativos notable en mantenimiento de estructura
    *   Beneficios pueden no justificar la complejidad
*   **Escala media**
    *   Balance óptimo entre Gastos administrativos y beneficios
    *   Excelente para cargas mixtas
*   **Escala grande**
    *   Escalabilidad limitada por operaciones de cola 
    *   Requiere optimizaciones adicionales

## Comparativa de eficiencia

| Estrategia    | Ventajas                     | Desventajas                                  | Mejor Escala |
| ------------- | --------------------------- | -------------------------------------------- | ------------- |
| Round Robin   | Simple, O(1) asignación       | No considera carga real                       | Pequeña-Media |
| Least Load    | Mejor distribución           | O(w) selección (mejorable a O(w) con heap)    | Media         |
| Random        | Mínimo Gastos administrativos| Distribución impredecible en escalas pequeñas | Grande        |
| Priority-Based | Control preciso de prioridades | O(log n) operaciones en la cola de prioridades | Media         |

## Escalabilidad y optimizaciones

### Mejoras implementadas
1. **Sistema de reintentos**
   - Máximo 3 intentos por tarea
   - Backoff exponencial entre intentos

2. **Optimización de caché**
   - Almacenamiento de patrones comunes
   - Reducción de costos en tareas similares

3. **Balance de carga**
   - Monitoreo continuo de capacidad
   - Redistribución dinámica

### Consideraciones futuras
1. **Escalado Horizontal**
   - Adición dinámica de trabajadores
   - Distribución geográfica

2. **Optimizaciones de rendimiento**
   - Predicción de carga
   - Agrupación de tareas similares

## resultados de ejecución 
### Para tomar una decisión de que modelo tomar se realiza la implementacion de tres modelos.
### se realizaron pruebas con las mismas consideraciones de ambiente de ejecución para todos los modelos.


### Ejecución con 100 tareas y 3 trabajadores 


| Estrategia        | Tareas Totales | Tareas Completadas | Tareas Fallidas | Tasa de Éxito | Tiempo Promedio de Ejecución | Tiempo de Ejecución (ms) |
|-------------------|----------------|--------------------|-----------------|---------------|-----------------------------|--------------------------|
| Round Robin      | 100            | 100                | 7               | 100%          | 49.03                       | 538                      |
| Carga Mínima     | 100            | 100                | 15              | 100%          | 49.03                       | 871                      |
| Asignación Aleat. | 100            | 100                | 8               | 100%          | 49.03                       | 875                      |

### Ejecución con 100 tareas y 10 trabajadores 


| Estrategia        | Tareas Totales | Tareas Completadas | Tareas Fallidas | Tasa de Éxito | Tiempo Promedio de Ejecución | Tiempo de Ejecución (ms) |
|-------------------|----------------|--------------------|-----------------|---------------|-----------------------------|--------------------------|
| Round Robin      | 100            | 100                | 8               | 100%          | 47.72                       | 320                      |
| Carga Mínima     | 100            | 100                | 15              | 100%          | 47.72                       | 328                      |
| Asignación Aleat. | 100            | 100                | 8               | 100%          | 47.72                       | 324                      |

### Ejecución con 1000 tareas y 100 trabajadores 



| Estrategia          | Tareas Totales | Tareas Completadas | Tareas Fallidas | Tiempo Promedio de Ejecución (ms) | Tiempo de Ejecución (ms) | Observaciones                                                                                                                                                                                                                                                                                                                      |
| Estrategia          | Tareas Totales | Tareas Completadas | Tareas Fallidas | Tiempo Promedio de Ejecución (ms) | Tiempo de Ejecución (ms) |
|-------------------|-------------|-------------------|--------------|--------------------------|-----------------------|
| Round Robin       | 1000        | 1000              | 110          | 49.921                   | 331                   |
| Least Load        | 1000        | 1000              | 116          | 49.921                   | 544                   |
| Random Assignment | 1000        | 1000              | 107          | 49.921                   | 546                   |

## Conclusiones:

*   El factor de fallos puede afectar en los tiempos de ejecución dado que no son constantes.
*   Round Robin escala de manera excelente. Su tiempo de ejecución se mantiene muy bajo en comparación con las otras estrategias, incluso al aumentar el número de tareas y trabajadores. Esto lo convierte en la opción preferida en todos los casos probados. Además podemos observar que Round Robin mantiene una carga de trabajadores pareja.
*   Least Load no escala bien y tiene una sobrecarga significativa. Su rendimiento empeora en comparación con Round Robin a medida que aumenta el número de tareas, lo que sugiere que el algoritmo de cálculo y gestión de la "carga" introduce una sobrecarga considerable. Los datos con 100 tareas y 10 trabajadores son especialmente reveladores, mostrando una gran diferencia de tiempo de ejecución en contra de Least Load.
*   Asignación Aleatoria ofrece un buen compromiso entre simplicidad y rendimiento. Si bien no es tan rápido como Round Robin, su rendimiento es aceptable y su implementación es mucho más sencilla que Least Load. Sin embargo, Round Robin lo supera en todos los aspectos.
*   Con 100 tareas y 10 trabajadores, Round Robin muestra una mejora significativa en el tiempo de ejecución. Esto podría indicar que Round Robin se beneficia especialmente de una proporción de tareas/trabajadores más baja.

**Recomendaciones:**

*   Usar Round Robin como estrategia predeterminada. Los datos muestran consistentemente su superioridad en todos los casos probados.
*   No usar Least Load en su implementación actual. Requiere una revisión y optimización profunda.
*   Considerar Asignación Aleatoria solo si la simplicidad de implementación es una prioridad absoluta y las diferencias de rendimiento con Round Robin son aceptables en el contexto específico. Sin embargo, dado el buen rendimiento de Round Robin y su simplicidad relativa, generalmente no hay una razón convincente para elegir Asignación Aleatoria.

**Nota importante:** Los resultados presentados fueron obtenidos en un equipo específico y por lo tanto, pueden variar en otros entornos.



## Requisitos previos técnico 
- Node.js 20+
- npm 10.8+
- TypeScript
  
## Estructura del proyecto
```
/
├── src/
│   ├── interfaces/
│   │   └── scheduler.interfaces.ts
│   ├── models/
│   │   ├── task.model.ts
│   │   └── worker.model.ts
│   ├── interfaces/
│   │   └── scheduler.interfaces.ts
│   ├── schedulers/
│   │   ├── base-scheduler.ts
│   │   ├── round-robin-scheduler.ts
│   │   ├── least-load-scheduler.ts
│   │   └── random-scheduler.ts
│   ├── services/
│   │   ├── scheduler-comparator.ts
│   |   └── task-scheduler-service.ts   
│   ├── utils/
│   │   ├── task-generator.ts
│   |   ├── worker-generator.ts
│   |   └── logger.ts
│   └── index.ts
├── test/
│   ├── jest.setup.ts
│   ├── models/
│   │   ├── task.model.test.ts
│   │   └── worker.model.test.ts
│   ├── schedulers/
│   │   ├── base-scheduler.test.ts
│   │   ├── round-robin-scheduler.test.ts
│   │   ├── least-load-scheduler.test.ts
│   │   └── random-scheduler.test.ts
│   ├── services/
│   │   ├── scheduler-comparator.test.ts
│   │   └── task-scheduler-service.test.ts
│   └── utils/
│       ├── task-generator.test.ts
│       └── worker-generator.test.ts
├── .gitignore
├── readme-md.md
├── package-lock.json
├── package.json
├── tsconfig.build.json
└── tsconfig.json
```
## Scripts disponibles

```bash
npm start           # Ejecuta la aplicación
npm run dev         # Modo desarrollo con recarga automática
npm test            # Ejecuta pruebas unitarias
npm test:watch      # Ejecuta pruebas unitarias
npm test:coverage   # Ejecuta pruebas unitarias
npm run build       # Compila TypeScript a JavaScript
npm run lint        # Verifica código con ESLint
```


## Licencia
MIT
