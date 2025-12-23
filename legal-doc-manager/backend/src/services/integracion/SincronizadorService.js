// backend/src/services/integracion/SincronizadorService.js
const getDatabase = require('../../models/database');

class SincronizadorService {
    constructor() {
        // En un entorno real de migración, estas serían conexiones distintas.
        // Para este entorno de desarrollo, ambas apuntan a la misma BD local.
        this.oldDb = getDatabase();
        this.newDb = getDatabase();
    }

    async sincronizarBidireccional() {
        console.log('Iniciando sincronización bidireccional...');
        try {
            await this.oldDb.connect(); // Asegurar conexión

            // 1. Sincronizar clientes → empresas
            await this.sincronizarClientes();

            // 2. Sincronizar unidades_negocio → unidades_casos
            await this.sincronizarUnidades();

            // 3. Sincronizar documentos
            await this.sincronizarDocumentos();

            // 4. Sincronizar transacciones
            await this.sincronizarTransacciones();

            console.log('Sincronización completada.');
        } catch (err) {
            console.error('Error durante sincronización:', err);
        }
    }

    async sincronizarClientes() {
        console.log('Sincronizando Clientes -> Fusion Empresas...');
        // Leer de BD antigua (Tabla 'clientes' existe en legal.db)
        const clientesViejos = await this.oldDb.all('SELECT * FROM clientes');

        for (const cliente of clientesViejos) {
            // Verificar si ya existe en nueva BD (Tabla 'fusion_empresas' o 'empresas')
            // Usaremos 'empresas' que es la tabla real implementada
            const existe = await this.newDb.get(
                'SELECT id FROM empresas WHERE codigo_empresa = ?',
                [`CLI-${cliente.id}`]
            );

            if (!existe) {
                // Crear en nueva BD
                await this.newDb.run(`
          INSERT INTO empresas (
            codigo_empresa, nombre_legal, tipo_empresa,
            contacto_principal, -- Mapeado de email/telefono
            fecha_registro, activo
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
                    `CLI-${cliente.id}`,
                    cliente.nombre,
                    'cliente',
                    JSON.stringify({ email: cliente.email, telefono: cliente.telefono }),
                    new Date().toISOString(),
                    1
                ]);
            }
        }
    }

    async sincronizarUnidades() {
        // Placeholder para unidades
        console.log('Sincronizando Unidades (Simulado)...');
    }

    async sincronizarDocumentos() {
        // Placeholder para documentos
        console.log('Sincronizando Documentos (Simulado)...');
    }

    async sincronizarTransacciones() {
        // Placeholder para transacciones
        console.log('Sincronizando Transacciones (Simulado)...');
    }

    async setupWebhookSync(app) {
        // Webhook que escucha cambios en ambas bases
        app.post('/api/sync/webhook', async (req, res) => {
            const { source, table, action, data } = req.body;

            console.log(`Webhook Sync recibido: ${source} tb:${table} act:${action}`);

            try {
                if (source === 'old') {
                    // Cambio en BD antigua, replicar a nueva
                    await this.replicateToNew(table, action, data);
                } else if (source === 'new') {
                    // Cambio en BD nueva, replicar a antigua
                    await this.replicateToOld(table, action, data);
                }
                res.json({ success: true });
            } catch (e) {
                console.error(e);
                res.status(500).json({ error: e.message });
            }
        });
    }

    async replicateToNew(table, action, data) {
        console.log(`Replicando a NUEVA BD: ${table} ${action}`);
    }

    async replicateToOld(table, action, data) {
        console.log(`Replicando a VIEJA BD: ${table} ${action}`);
    }
}

module.exports = new SincronizadorService();
