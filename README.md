# Dashboard de Frutería

## Tecnologías utilizadas

- React + Vite + TypeScript
- Ant Design v5.29.2
- Backend API (JSON Server o backend simple)

## Descripción del proyecto

Este proyecto es una aplicación web para la gestión integral de una frutería, que permite controlar inventario, registrar entradas y salidas de productos, y gestionar la caducidad de los mismos. Se prioriza la usabilidad y accesibilidad.

## Vistas incluidas

- **Dashboard:** Visualización general con stock total, productos por caducar y movimientos recientes de entradas y salidas.
- **Gestión de productos:** Listado con al menos 15 productos, alta, edición y eliminación.
- **Entradas:** Registro y actualización automática del stock al ingresar productos.
- **Salidas:** Registro y validación para evitar stock negativo.
- **Caducidad:** Visualización clara de productos vigentes, próximos a caducar y caducados, con indicadores visuales y filtros.

## Accesibilidad

- Formularios con etiquetas y validaciones claras.
- Contraste de colores adecuado.
- Navegación por teclado y scroll optimizado.
- Mensajes claros para éxito, error y advertencia.

## Usabilidad

- Menú sencillo y claro.
- Flujo de acciones lineal y fácil de seguir.
- Información visual clara y destacada.

## Requisitos previos

- Node.js versión 14 o superior
- npm o yarn instalado
- Backend API corriendo en `http://localhost:3001` (puedes usar JSON Server o un backend simple)

## Instalación

Clonar el repositorio:

```bash
## Instalación

Clonar el repositorio:

git clone https://github.com/Yadimmm/FruteriaTurboBANANA.git
cd FruteriaTurboBANANA
#Instalar dependencias:
npm install
# o
yarn install

Ejecución

Iniciar la aplicación en modo desarrollo:

npm run dev
# o
yarn dev

Abrir en el navegador:

http://localhost:5173/