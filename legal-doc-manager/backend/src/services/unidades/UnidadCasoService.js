// backend/src/services/unidades/UnidadCasoService.js
class UnidadCasoService {
    constructor() {
        this.db = require('../../models/database')();
        this.documentService = require('../documentos/DocumentoService');
        this.finanzaService = require('../finanzas/FinanzaService');
    }

    // Crear unidad caso con datos fusionados
    async crearUnidadCaso(data) {
        const {
            // Datos generales
            codigo_unidad,
            empresa_id,
            tipo_unidad,
            nombre,
            descripcion,

            // Datos legales
            numero_expediente,
            juzgado,
            materia_legal,

            // Datos financieros
            presupuesto_asignado,
            tasa_horaria,

            // Asignación
            responsable_id,
            equipo_ids
        } = data;

        // Validar empresa
        const empresa = await this.db.get(
            'SELECT id FROM empresas WHERE id = ? AND activo = 1',
            [empresa_id]
        );

        if (!empresa) {
            throw new Error('Empresa no encontrada o inactiva');
        }

        // Generar código si no viene
        const codigo = codigo_unidad || this.generarCodigoUnidad(tipo_unidad);

        // Crear unidad caso
        const result = await this.db.run(`
      INSERT INTO unidades_casos (
        codigo_unidad, empresa_id, tipo_unidad, nombre, descripcion,
        numero_expediente, juzgado, materia_legal,
        presupuesto_asignado, tasa_horaria,
        responsable_id, equipo_ids, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            codigo, empresa_id, tipo_unidad, nombre, descripcion,
            numero_expediente, juzgado, materia_legal,
            presupuesto_asignado || 0, tasa_horaria || 0,
            responsable_id, JSON.stringify(equipo_ids || []), 'activo'
        ]);

        // Inicializar seguimiento financiero
        if (presupuesto_asignado > 0) {
            await this.finanzaService.inicializarPresupuesto(result.id, presupuesto_asignado);
        }

        // Crear tarea inicial
        await this.crearTareaInicial(result.id, responsable_id);

        return await this.obtenerUnidadCasoPorId(result.id);
    }

    // Obtener unidad caso con datos fusionados
    async obtenerUnidadCasoPorId(id) {
        const unidad = await this.db.get(`
      SELECT uc.*, 
             e.nombre_legal as empresa_nombre,
             e.codigo_empresa,
             u.nombre as responsable_nombre,
             u.apellido_paterno as responsable_apellido
      FROM unidades_casos uc
      LEFT JOIN empresas e ON uc.empresa_id = e.id
      LEFT JOIN usuarios u ON uc.responsable_id = u.id
      WHERE uc.id = ?
    `, [id]);

        if (!unidad) {
            return null;
        }

        // Obtener datos adicionales
        const [
            documentos,
            transacciones,
            tareas,
            equipo
        ] = await Promise.all([
            this.documentService.obtenerDocumentosPorUnidad(id),
            this.finanzaService.obtenerTransaccionesPorUnidad(id),
            this.obtenerTareasPorUnidad(id),
            this.obtenerEquipoUnidad(id)
        ]);

        // Calcular métricas fusionadas
        const metricas = await this.calcularMetricasUnidad(id);

        return {
            ...unidad,
            documentos,
            transacciones,
            tareas,
            equipo,
            metricas
        };
    }

    // Calcular métricas fusionadas
    async calcularMetricasUnidad(unidadId) {
        const metricas = await this.db.get(`
      SELECT 
        -- Financiero
        COALESCE(SUM(CASE 
          WHEN tf.tipo_transaccion IN ('ingreso', 'honorario') 
          THEN tf.monto ELSE 0 
        END), 0) as ingresos_totales,
        
        COALESCE(SUM(CASE 
          WHEN tf.tipo_transaccion IN ('gasto', 'reembolso') 
          THEN tf.monto ELSE 0 
        END), 0) as gastos_totales,
        
        -- Documental
        COUNT(DISTINCT d.id) as total_documentos,
        SUM(d.horas_trabajo) as horas_documentos,
        SUM(d.costo_real) as costo_documentos,
        
        -- Temporal
        COUNT(DISTINCT ta.id) as total_tareas,
        SUM(ta.horas_reales) as horas_tareas
      
      FROM unidades_casos uc
      LEFT JOIN transacciones_financieras tf ON uc.id = tf.unidad_caso_id
      LEFT JOIN documentos d ON uc.id = d.unidad_caso_id
      LEFT JOIN tareas_actividades ta ON uc.id = ta.unidad_caso_id
      WHERE uc.id = ?
      GROUP BY uc.id
    `, [unidadId]);

        // Si no hay métricas (unidad nueva), retornar ceros
        if (!metricas) {
            return {
                ingresos_totales: 0,
                gastos_totales: 0,
                roi: 0,
                balance: 0,
                eficiencia: 0
            };
        }

        // Calcular ROI
        const roi = metricas.ingresos_totales > 0
            ? ((metricas.ingresos_totales - metricas.gastos_totales) / metricas.gastos_totales) * 100
            : 0;

        return {
            ...metricas,
            roi: Math.round(roi * 100) / 100,
            balance: metricas.ingresos_totales - metricas.gastos_totales,
            eficiencia: metricas.horas_documentos > 0
                ? metricas.costo_documentos / metricas.horas_documentos
                : 0
        };
    }

    // Generar reporte combinado
    async generarReporteUnidad(unidadId, tipoReporte = 'completo') {
        const unidad = await this.obtenerUnidadCasoPorId(unidadId);

        const reporte = {
            unidad: {
                id: unidad.id,
                codigo: unidad.codigo_unidad,
                nombre: unidad.nombre,
                empresa: unidad.empresa_nombre,
                estado: unidad.estado
            },

            financiero: {
                presupuesto: unidad.presupuesto_asignado,
                gastado: unidad.metricas.gastos_totales,
                pendiente: unidad.presupuesto_asignado - unidad.metricas.gastos_totales,
                ingresos: unidad.metricas.ingresos_totales,
                balance: unidad.metricas.balance,
                roi: unidad.metricas.roi
            },

            documental: {
                total_documentos: unidad.metricas.total_documentos,
                horas_trabajo: unidad.metricas.horas_documentos,
                costo_documentos: unidad.metricas.costo_documentos,
                documentos_por_tipo: await this.agruparDocumentosPorTipo(unidadId)
            },

            operativo: {
                total_tareas: unidad.metricas.total_tareas,
                tareas_completadas: unidad.tareas.filter(t => t.estado === 'completada').length,
                tareas_pendientes: unidad.tareas.filter(t => t.estado === 'pendiente').length,
                porcentaje_completado: unidad.porcentaje_completado
            }
        };

        return reporte;
    }

    // Métodos auxiliares
    generarCodigoUnidad(tipo) {
        const prefix = {
            'caso_legal': 'CASE',
            'proyecto': 'PROJ',
            'contrato': 'CONT',
            'litigio': 'LITG'
        }[tipo] || 'UNIT';

        return `${prefix}-${Date.now().toString(36).toUpperCase()}`;
    }

    // Stubs para métodos faltantes
    async obtenerTareasPorUnidad(id) {
        return await this.db.all('SELECT * FROM tareas_actividades WHERE unidad_caso_id = ?', [id]) || [];
    }

    async obtenerEquipoUnidad(id) {
        const unidad = await this.db.get('SELECT equipo_ids FROM unidades_casos WHERE id = ?', [id]);
        if (!unidad || !unidad.equipo_ids) return [];
        try {
            const ids = JSON.parse(unidad.equipo_ids);
            if (!ids.length) return [];
            // Convertir array de IDs a string para consulta IN
            const placeholders = ids.map(() => '?').join(',');
            return await this.db.all(`SELECT id, nombre, apellido_paterno, rol_principal FROM usuarios WHERE id IN (${placeholders})`, ids);
        } catch (e) {
            return [];
        }
    }

    async crearTareaInicial(unidadId, responsableId) {
        if (!responsableId) return;
        await this.db.run(`
        INSERT INTO tareas_actividades (
            unidad_caso_id, codigo_tarea, titulo, descripcion, 
            tipo_tarea, asignado_a, estado, prioridad
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
            unidadId,
            `TASK-${Date.now()}`,
            'Configuración Inicial',
            'Revisar y configurar la nueva unidad de caso/proyecto',
            'revision',
            responsableId,
            'pendiente',
            'alta'
        ]);
    }

    async agruparDocumentosPorTipo(unidadId) {
        return await this.db.all(`
        SELECT tipo_documento, COUNT(*) as cantidad 
        FROM documentos 
        WHERE unidad_caso_id = ? 
        GROUP BY tipo_documento
    `, [unidadId]);
    }
}

module.exports = new UnidadCasoService();
