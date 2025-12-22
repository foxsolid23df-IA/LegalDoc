// Datos simulados para modo Demo (GitHub Pages)

const mockUsers = [
    { id: 1, email: 'admin@legal.com', password: '123', nombre: 'Admin', apellido: 'Sistema', rol: 'admin', activo: true },
    { id: 2, email: 'abogado@legal.com', password: '123', nombre: 'Roberto', apellido: 'García', rol: 'abogado', activo: true },
    { id: 3, email: 'asistente@legal.com', password: '123', nombre: 'Ana', apellido: 'Martínez', rol: 'asistente', activo: true }
];

const mockDocuments = [
    { id: 1, nombre_original: 'Contrato_Servicios_V1.pdf', tipo_documento: 'contrato', tamaño_bytes: 1024000, extension: 'pdf', fecha_upload: new Date().toISOString(), propietario_nombre: 'Roberto', propietario_apellido: 'García', confidencialidad: 3, caso_numero: 'CAS-001' },
    { id: 2, nombre_original: 'Demanda_Civil_2024.docx', tipo_documento: 'demanda', tamaño_bytes: 512000, extension: 'docx', fecha_upload: new Date(Date.now() - 86400000).toISOString(), propietario_nombre: 'Admin', propietario_apellido: 'Sistema', confidencialidad: 5, caso_numero: 'CAS-002' },
    { id: 3, nombre_original: 'Evidencia_Fotográfica.jpg', tipo_documento: 'evidencia', tamaño_bytes: 2048000, extension: 'jpg', fecha_upload: new Date(Date.now() - 172800000).toISOString(), propietario_nombre: 'Ana', propietario_apellido: 'Martínez', confidencialidad: 2, caso_numero: 'CAS-001' }
];

const mockLogs = [
    { id: 1, usuario_id: 1, nombre: 'Admin', apellido: 'Sistema', accion: 'login', detalles: 'Inicio de sesión exitoso', fecha_registro: new Date().toISOString() },
    { id: 2, usuario_id: 2, nombre: 'Roberto', apellido: 'García', accion: 'subir', detalles: 'Subió documento Contrato_Servicios', fecha_registro: new Date(Date.now() - 3600000).toISOString() },
    { id: 3, usuario_id: 3, nombre: 'Ana', apellido: 'Martínez', accion: 'descargar', detalles: 'Descargó documento Demanda_Civil', fecha_registro: new Date(Date.now() - 7200000).toISOString() }
];

// Simulador de delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const mockAuthService = {
    login: async (email, password) => {
        await delay(800);
        const user = mockUsers.find(u => u.email === email);
        // En demo, aceptamos cualquier password si el usuario existe, o validamos simple
        if (user && (password === 'Admin123!' || password === 'User123!' || password === '123')) {
            return {
                token: 'mock-jwt-token-demo-mode',
                user: user
            };
        }
        throw { response: { status: 401, data: { message: 'Credenciales inválidas (Demo: usa admin@legal.com / Admin123!)' } } };
    },
    logout: async () => { await delay(500); return { success: true }; },
    getProfile: async () => {
        await delay(500);
        return { success: true, data: mockUsers[0] }; // Retorna admin por defecto si no hay contexto real
    },
    verifyToken: async () => { return { valid: true, user: mockUsers[0] }; }
};

export const mockDocumentService = {
    getAll: async (params) => {
        await delay(1000);
        // Filtrado simple simulado
        let data = [...mockDocuments];
        if (params?.q) {
            const q = params.q.toLowerCase();
            data = data.filter(d => d.nombre_original.toLowerCase().includes(q));
        }
        return { success: true, data: data };
    },
    upload: async (formData) => {
        await delay(2000);
        const newDoc = {
            id: mockDocuments.length + 1,
            nombre_original: formData.get('nombre_original') || 'Nuevo_Documento.pdf',
            tipo_documento: formData.get('tipo_documento') || 'otro',
            tamaño_bytes: 1000,
            extension: 'pdf',
            fecha_upload: new Date().toISOString(),
            propietario_nombre: 'Usuario',
            propietario_apellido: 'Demo',
            confidencialidad: 3
        };
        mockDocuments.unshift(newDoc);
        return { success: true, data: newDoc };
    },
    getById: async (id) => {
        await delay(500);
        const doc = mockDocuments.find(d => d.id == id);
        return { success: true, data: doc };
    },
    delete: async (id) => {
        await delay(1000);
        const index = mockDocuments.findIndex(d => d.id == id);
        if (index > -1) mockDocuments.splice(index, 1);
        return { success: true };
    },
    // Métodos vacíos para evitar crash
    lock: async () => ({ success: true }),
    unlock: async () => ({ success: true }),
    download: async () => new Blob(['Contenido demo'], { type: 'application/pdf' }),
    getLockStatus: async () => ({ success: true, data: { isLocked: false } }),
    getVersions: async () => ({ success: true, data: [] }),
    share: async () => ({ success: true }),
    getShares: async () => ({ success: true, data: [] }),
    revokeShare: async () => ({ success: true })
};

export const mockUserService = {
    getAll: async () => {
        await delay(800);
        return { success: true, data: mockUsers };
    },
    create: async (data) => {
        await delay(1000);
        mockUsers.push({ ...data, id: mockUsers.length + 1, activo: true });
        return { success: true };
    },
    update: async () => ({ success: true }),
    toggleStatus: async () => ({ success: true }),
    resetPassword: async () => ({ success: true })
};

export const mockLogService = {
    getRecent: async () => {
        await delay(600);
        return { success: true, data: mockLogs };
    },
    getActivity: async () => {
        await delay(1000);
        return { success: true, data: mockLogs }; // Retorna mismos logs
    },
    getStatistics: async () => {
        return { success: true, data: { totalDocs: 15, totalUsers: 3, storage: '45%' } };
    }
};
