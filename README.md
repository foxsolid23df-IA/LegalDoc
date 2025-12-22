# ⚖️ LegalDoc - Sistema de Gestión Documental Legal

![Estado del Proyecto](https://img.shields.io/badge/Estado-Finalizado-success)
![Versión](https://img.shields.io/badge/Versión-1.0.0-blue)
![Licencia](https://img.shields.io/badge/Licencia-MIT-green)

**LegalDoc** es una solución integral diseñada para modernizar y asegurar la gestión de archivos en despachos jurídicos. Permite la administración eficiente de documentos, casos y usuarios con un enfoque en la seguridad, trazabilidad y auditoría.

🔗 **Repositorio:** [https://github.com/foxsolid23df-IA/LegalDoc](https://github.com/foxsolid23df-IA/LegalDoc)

---

## 🚀 Características Principales

*   **📁 Gestión Documental Avanzada:** Carga, descarga, versionado y clasificación de archivos legales (Contratos, Demandas, Evidencias).
*   **🔒 Seguridad y Auditoría:** Registro inmutable de actividad (Logs) que rastrea quién accedió, modificó o eliminó un documento.
*   **💼 Gestión de Casos:** Organización de expedientes por cliente, prioridad y estado.
*   **👥 Control de Acceso Basado en Roles (RBAC):**
    *   **Admin:** Control total del sistema.
    *   **Abogado:** Gestión de sus casos y documentos asignados.
    *   **Asistente:** Permisos limitados de lectura y apoyo.
*   **📊 Dashboard Interactivo:** Métricas en tiempo real sobre el volumen de trabajo y actividad reciente.

---

## 🛠️ Stack Tecnológico

### Frontend
*   **React.js** (Vite/CRA)
*   **Material-UI (MUI)** para una interfaz moderna y responsiva.
*   **Axios** para comunicación HTTP.
*   **React Router** para navegación.

### Backend
*   **Node.js & Express:** API RESTful robusta.
*   **SQLite:** Base de datos ligera y eficiente (fichero local).
*   **JWT (JSON Web Tokens):** Autenticación segura.
*   **Multer:** Manejo seguro de subida de archivos.
*   **Winston:** Sistema avanzado de logging.

---

## 💻 Instalación y Configuración (Modo Demo)

Este proyecto incluye un script de **"Semilla" (Seed)** que puebla la base de datos con información ficticia (Casos, Clientes, Usuarios, Documentos) para facilitar la revisión y pruebas sin necesidad de capturar datos manualmente.

### 1. Clonar el repositorio
```bash
git clone https://github.com/foxsolid23df-IA/LegalDoc.git
cd LegalDoc
```

### 2. Configurar el Backend
```bash
cd legal-doc-manager/backend
npm install

# Inicializar Base de Datos y Entorno
npm run setup

# 🌱 IMPORTANTE: Cargar datos ficticios para MODO DEMO
node scripts/seed.js

# Iniciar Servidor (Puerto 3001)
npm run dev
```

### 3. Configurar el Frontend (en nueva terminal)
```bash
cd legal-doc-manager/frontend
npm install

# Iniciar Cliente (Puerto 3000)
npm start
```

---

## 🔑 Credenciales de Acceso (Demo)

El sistema viene pre-cargado con los siguientes usuarios para probar los diferentes roles:

| Rol | Email | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@legal.com` | `Admin123!` | Acceso Total |
| **Abogado** | `abogado@legal.com` | `User123!` | Edición y Casos |
| **Asistente** | `asistente@legal.com` | `User123!` | Solo Lectura |

---

## 📸 Capturas de Pantalla

| Dashboard | Documentos |
| :---: | :---: |
| ![Dashboard](./docs/dashboard.png) | ![Documentos](./docs/documents.png) |

| Logs de Auditoría | Gestión de Usuarios |
| :---: | :---: |
| ![Logs](./docs/logs.png) | ![Usuarios](./docs/users.png) |

*(Nota: Las imágenes son referenciales del entorno de demostración).*

---

## 🛡️ Estructura del Proyecto

```
LegalDoc/
├── backend/            # API Servidor (Node.js)
│   ├── src/
│   │   ├── controllers/# Lógica de negocio
│   │   ├── models/     # Definición de Base de Datos
│   │   ├── routes/     # Endpoints API
│   │   └── middleware/ # Seguridad y Validación
│   ├── scripts/        # Scripts de instalación y seed
│   ├── uploads/        # Almacenamiento físico de archivos
│   └── legal.db        # Base de datos SQLite
│
├── frontend/           # Cliente Web (React)
│   ├── src/
│   │   ├── components/ # Componentes reutilizables
│   │   ├── pages/      # Vistas principales
│   │   ├── services/   # Conexión con API
│   │   └── contexts/   # Estado global (Auth)
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT** - eres libre de usarlo y modificarlo para fines académicos o comerciales.

---
 Desarrollado con ❤️ para la gestión legal eficiente.
