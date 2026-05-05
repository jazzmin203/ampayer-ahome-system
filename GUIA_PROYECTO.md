# Guía de Ejecución y Estructura del Proyecto

Esta guía detalla cómo configurar, ejecutar y entender los diferentes componentes del ecosistema de la **Asociación de Ampayers del Profe Bernal**.

---

## 🏗️ Estructura del Proyecto

El proyecto está dividido en tres pilares principales:

1.  **`ampayer_project` (Backend)**: API robusta construida con Django y Django REST Framework. Gestiona la base de datos, autenticación JWT y la lógica de negocio (IA de asignación, marcación en vivo).
2.  **`ampayer_web` (Portal Web)**: Interfaz administrativa y de gestión construida con Next.js (App Router). Permite la gestión de ligas, equipos y marcación digital avanzada.
3.  **`ampayer_mobile` (App Móvil)**: Aplicación para Ampayers y Anotadores construida con Expo (React Native). Enfocada en movilidad y notificaciones.

---

## 🚀 Instrucciones de Ejecución

### 1. Backend (Django)
**Requisitos**: Python 3.10+
1.  Navega a la carpeta: `cd ampayer_project`
2.  Instala dependencias: `pip install -r requirements.txt` (si existe) o asegúrate de tener `django`, `djangorestframework`, `django-cors-headers`, `djangorestframework-simplejwt`.
3.  Aplica migraciones: `python manage.py migrate`
4.  Poblar datos de prueba: `python setup_test_env.py`
5.  Inicia el servidor: `python manage.py runserver 0.0.0.0:8000`

### 2. Portal Web (Next.js)
**Requisitos**: Node.js 18+
1.  Navega a la carpeta: `cd ampayer_web`
2.  Instala dependencias: `npm install`
3.  Inicia en modo desarrollo: `npm run dev`
4.  Accede en: `http://localhost:3000`

### 3. App Móvil (Expo)
**Requisitos**: Node.js, Expo Go (en celular)
1.  Navega a la carpeta: `cd ampayer_mobile`
2.  Instala dependencias: `npm install`
3.  Inicia Expo: `npx expo start`
4.  Escanea el código QR con la app **Expo Go** en tu dispositivo.

---

## 👥 Usuarios de Prueba
Todos los usuarios tienen la contraseña: `pass123`

| Usuario | Rol | Descripción |
| :--- | :--- | :--- |
| `admin_user` | Administrador | Acceso total a KPIs y gestión de usuarios. |
| `pres_user` | Presidente | Gestión de ligas y equipos. |
| `amp_1` | Ampayer | Ve y confirma sus asignaciones. |
| `scorer_1` | Anotador | Acceso al módulo de marcación digital. |

---

## 📂 Archivos Clave y su Función

### Backend (`ampayer_project/core`)
-   `models.py`: Define la estructura de datos (Juegos, Equipos, Usuarios, Jugadas).
-   `serializers.py`: Transforma los datos del servidor a JSON para la web y el móvil.
-   `views.py`: Contiene la lógica de los endpoints (ej. `record_play` para guardar strikes/bolas).
-   `setup_test_env.py`: Script de automatización para crear un entorno de pruebas listo para usar.

### Web (`ampayer_web/src`)
-   `app/(dashboard)/dashboard/page.tsx`: Tablero principal dinámico que cambia según el rol del usuario.
-   `app/(dashboard)/dashboard/scoring/page.tsx`: El "Gamecast" digital para anotar juegos en vivo con sincronización API.
-   `hooks/useAuth.ts`: Maneja la persistencia de la sesión y los permisos de usuario.

### Mobile (`ampayer_mobile/src`)
-   `context/AuthContext.tsx`: Gestiona el login y el almacenamiento seguro del token en el celular.
-   `navigation/index.tsx`: Controla qué pantallas ve el usuario (si es ampayeo o anotador).
-   `services/api.ts`: Configura la comunicación con el servidor central.

---

## 🛠️ Correcciones Realizadas Recientemente
-   **Web**: Se corrigió un error de compilación relacionado con `asChild` en el dashboard.
-   **Web**: Se agregó `Suspense` en la página de anotación para permitir la generación estática (SSG) de Next.js.
-   **Backend**: Se ajustó el `PlaySerializer` para que el campo `game` sea automático, facilitando el uso de la API.
-   **Seguridad**: Se verificaron los permisos (RBAC) para asegurar que un Ampayer no pueda acceder a funciones de Administrador.
