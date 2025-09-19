# API de Fechas Hábiles - Colombia

API REST desarrollada en TypeScript para calcular fechas hábiles en Colombia, teniendo en cuenta días festivos nacionales, horarios laborales y conversiones de zona horaria.

## 📋 Descripción del Proyecto

Esta API fue desarrollada como parte de una prueba técnica para CAPTA, implementando un sistema que calcula fechas hábiles considerando:

- **Días laborales**: Lunes a viernes
- **Horario laboral**: 8:00 AM a 5:00 PM (hora de Colombia)
- **Almuerzo**: 12:00 PM a 1:00 PM (no laboral)
- **Días festivos**: Festivos oficiales de Colombia (2025-2035)
- **Zona horaria**: Cálculos en `America/Bogota`, respuesta en UTC

## 🚀 Características Implementadas

### ✅ Funcionalidades Core
- **Cálculo de fechas hábiles** sumando días y/o horas
- **Manejo de zona horaria** Colombia → UTC
- **Gestión de días festivos** desde archivo JSON
- **Validación de horarios laborales** con horario de almuerzo
- **Ajuste automático** a horarios/días laborales válidos
- **API REST** con endpoints documentados

### ✅ Arquitectura y Calidad
- **TypeScript** con tipado estricto en toda la aplicación
- **Arquitectura modular** (controladores, servicios, middleware, utils)
- **Manejo centralizado de errores** con códigos HTTP apropiados
- **Tests unitarios** con Jest cubriendo casos edge
- **Validación de parámetros** robusta
- **Middleware CORS** configurado

## 🏗️ Estructura del Proyecto

```
fechas-habiles-capta/
├── src/
│   ├── app.ts                    # Configuración de Express
│   ├── server.ts                 # Punto de entrada del servidor
│   ├── controllers/
│   │   └── dateController.ts     # Controlador principal de fechas
│   ├── services/
│   │   └── dateService.ts        # Lógica de negocio para cálculos
│   ├── middleware/
│   │   ├── cors.ts              # Middleware CORS
│   │   ├── httpErrorHandlers.ts # Manejadores de errores HTTP
│   │   └── index.ts             # Exportaciones de middleware
│   ├── types/
│   │   └── index.ts             # Definiciones de tipos TypeScript
│   └── utils/
│       ├── apiErrorHandler.ts   # Manejo centralizado de errores
│       └── holidayUtils.ts      # Gestión de días festivos
├── tests/
│   ├── dateService.test.ts      # Tests del servicio de fechas
│   └── holidayUtils.test.ts     # Tests de utilidades de festivos
├── dist/                        # Código compilado (generado)
├── WorkingDays.json             # Lista de días festivos 2025-2035
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## 📡 API Endpoints

### `GET /work-date`
Endpoint principal para calcular fechas hábiles.

**Parámetros de Query:**
- `days` (opcional): Número de días hábiles a sumar (entero positivo)
- `hours` (opcional): Número de horas hábiles a sumar (entero positivo) 
- `date` (opcional): Fecha inicial en UTC ISO 8601 con sufijo Z

**Respuesta exitosa (200):**
```json
{
  "date": "2025-01-20T14:00:00.000Z"
}
```

**Respuesta de error (400, 500):**
```json
{
  "error": "InvalidParameters",
  "message": "Detalle del error"
}
```

### `GET /health`
Verificación del estado de la API.

### `GET /`
Documentación básica y ejemplos de uso.

## 🔧 Instalación y Configuración

### Prerrequisitos
- Node.js (v16 o superior)
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone <repository-url>
cd fechas-habiles-capta

# Instalar dependencias
npm install

# Compilar TypeScript
npm run build
```

### Scripts Disponibles
```bash
# Desarrollo con recarga automática
npm run dev

# Compilar TypeScript
npm run build

# Ejecutar en producción
npm start

# Ejecutar tests
npm test

# Ejecutar tests en modo watch
npm run test:watch
```

## 📚 Ejemplos de Uso

### Ejemplo 1: Sumar 1 hora desde viernes 5:00 PM
```bash
GET /work-date?hours=1&date=2025-01-17T22:00:00.000Z
# Resultado: 2025-01-20T14:00:00.000Z (lunes 9:00 AM Colombia)
```

### Ejemplo 2: Sumar 1 día + 4 horas desde martes 3:00 PM
```bash
GET /work-date?days=1&hours=4&date=2025-01-21T20:00:00.000Z
# Resultado: 2025-01-23T15:00:00.000Z (jueves 10:00 AM Colombia)
```

### Ejemplo 3: Calcular desde fecha con festivos
```bash
GET /work-date?days=5&hours=4&date=2025-04-10T15:00:00.000Z
# Resultado: 2025-04-21T20:00:00.000Z (saltando festivos 17-18 abril)
```

### Ejemplo 4: Usar fecha actual
```bash
GET /work-date?days=1&hours=2
# Calcula desde la hora actual en Colombia
```

## 🧪 Tests

El proyecto incluye tests unitarios completos:

```bash
# Ejecutar todos los tests
npm test

# Ver cobertura
npm test -- --coverage
```

### Tests Implementados
- **DateService**: Todos los ejemplos de la prueba técnica
- **HolidayManager**: Validación de festivos, fines de semana y días laborales
- **Casos edge**: Horarios de almuerzo, múltiples festivos consecutivos

## 🔧 Tecnologías Utilizadas

### Dependencias de Producción
- **Express.js** `^4.18.2` - Framework web
- **Day.js** `^1.11.10` - Manipulación de fechas y zonas horarias

### Dependencias de Desarrollo
- **TypeScript** `^5.3.3` - Tipado estático
- **Jest** `^29.7.0` - Framework de testing
- **ts-jest** `^29.1.1` - Configuración Jest para TypeScript
- **@types/express** `^4.17.21` - Tipos para Express
- **@types/node** `^20.10.5` - Tipos para Node.js

## 📐 Arquitectura y Patrones

### Separación de Responsabilidades
- **Controllers**: Manejo de requests/responses HTTP
- **Services**: Lógica de negocio pura
- **Utils**: Utilidades reutilizables (festivos, errores)
- **Middleware**: Interceptores (CORS, errores)
- **Types**: Definiciones de tipos centralizadas

### Características de TypeScript
- **Tipado estricto** en toda la aplicación
- **Interfaces** para requests, responses y configuración
- **Enums** para tipos de errores
- **Tipos personalizados** para fechas y parámetros

### Manejo de Errores
- **Centralizado** a través de `ApiErrorHandler`
- **Códigos HTTP apropiados** (400, 500)
- **Mensajes descriptivos** en español
- **Logging** para debugging

## 🌐 Lógica de Negocio

### Configuración Laboral Colombia
```typescript
const WORKING_CONFIG = {
  hours: {
    start: 8,      // 8:00 AM
    end: 17,       // 5:00 PM  
    lunchStart: 12, // 12:00 PM
    lunchEnd: 13   // 1:00 PM
  },
  days: {
    monday: true, tuesday: true, wednesday: true,
    thursday: true, friday: true,
    saturday: false, sunday: false
  },
  timezone: 'America/Bogota'
}
```

### Algoritmo de Cálculo
1. **Conversión a zona horaria Colombia**
2. **Ajuste a horario laboral válido**
3. **Suma de días hábiles** (saltando festivos/fines de semana)
4. **Suma de horas laborales** (respetando almuerzo)
5. **Conversión final a UTC**

### Días Festivos
Los días festivos se cargan desde `WorkingDays.json` con fechas para 2025-2035, obtenidas del recurso oficial de CAPTA.

## 🔍 Validaciones Implementadas

### Parámetros de Entrada
- Al menos uno de `days` o `hours` debe estar presente
- Valores deben ser enteros positivos
- Parámetro `date` debe estar en formato ISO 8601 UTC con sufijo Z

### Ajustes Automáticos
- **Antes de 8:00 AM**: Se ajusta a 8:00 AM
- **Después de 5:00 PM**: Se mueve al siguiente día laboral a 8:00 AM
- **Durante almuerzo**: Se ajusta a 1:00 PM
- **Fin de semana/festivo**: Se mueve al siguiente día laboral a 8:00 AM

## 🚀 Próximos Pasos - Despliegue AWS Lambda