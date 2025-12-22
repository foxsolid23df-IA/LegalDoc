import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    Box,
    Paper,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Card,
    CardContent,
    LinearProgress,
    Alert,
    IconButton,
    Chip,
    Stepper,
    Step,
    StepLabel,
} from '@mui/material';
import {
    CloudUpload as UploadIcon,
    Close as CloseIcon,
    Description as DocumentIcon,
    ArrowBack as BackIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { documentService } from '../../services/api';
import { toast } from 'react-hot-toast';

const DropzoneContainer = styled(Paper)(({ theme, isDragActive }) => ({
    border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(4),
    textAlign: 'center',
    backgroundColor: isDragActive ? theme.palette.primary.lighter : theme.palette.background.paper,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    '&:hover': {
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.lighter,
    },
}));

const DocumentUpload = () => {
    const navigate = useNavigate();
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [step, setStep] = useState(0);

    const validationSchema = Yup.object({
        nombre_original: Yup.string()
            .required('El nombre es requerido')
            .max(255, 'El nombre no puede exceder 255 caracteres'),
        tipo_documento: Yup.string()
            .required('El tipo de documento es requerido'),
        confidencialidad: Yup.number()
            .min(1, 'La confidencialidad debe ser al menos 1')
            .max(5, 'La confidencialidad no puede exceder 5')
            .required('La confidencialidad es requerida'),
        caso_id: Yup.string().optional(),
        descripcion: Yup.string().optional(),
    });

    const formik = useFormik({
        initialValues: {
            nombre_original: '',
            tipo_documento: '',
            confidencialidad: 3,
            caso_id: '',
            descripcion: '',
        },
        validationSchema,
        onSubmit: async (values) => {
            if (!uploadedFile) {
                toast.error('Por favor selecciona un archivo primero');
                return;
            }

            try {
                setUploading(true);
                setUploadProgress(0);

                const formData = new FormData();
                formData.append('document', uploadedFile);
                formData.append('nombre_original', values.nombre_original);
                formData.append('tipo_documento', values.tipo_documento);
                formData.append('confidencialidad', values.confidencialidad);
                if (values.caso_id) formData.append('caso_id', values.caso_id);
                if (values.descripcion) formData.append('descripcion', values.descripcion);

                // Simular progreso de carga
                const progressInterval = setInterval(() => {
                    setUploadProgress((prev) => {
                        if (prev >= 90) {
                            clearInterval(progressInterval);
                            return 90;
                        }
                        return prev + 10;
                    });
                }, 200);

                await documentService.upload(formData);

                clearInterval(progressInterval);
                setUploadProgress(100);

                toast.success('Documento subido exitosamente');

                // Esperar un momento para mostrar el progreso completo
                setTimeout(() => {
                    navigate('/documents');
                }, 1000);
            } catch (error) {
                setUploading(false);
                setUploadProgress(0);
                toast.error('Error subiendo documento');
            }
        },
    });

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'text/plain': ['.txt'],
            'application/rtf': ['.rtf'],
            'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
        },
        maxSize: parseInt(process.env.REACT_APP_MAX_FILE_SIZE || '52428800'),
        onDrop: (acceptedFiles, rejectedFiles) => {
            if (rejectedFiles.length > 0) {
                const error = rejectedFiles[0].errors[0];
                if (error.code === 'file-too-large') {
                    toast.error('El archivo es demasiado grande (máximo 50MB)');
                } else if (error.code === 'file-invalid-type') {
                    toast.error('Tipo de archivo no permitido');
                }
                return;
            }

            if (acceptedFiles.length > 0) {
                const file = acceptedFiles[0];
                setUploadedFile(file);
                formik.setFieldValue('nombre_original', file.name);
                setStep(1);
            }
        },
    });

    const documentTypes = [
        { value: 'contrato', label: 'Contrato' },
        { value: 'demanda', label: 'Demanda' },
        { value: 'fianza', label: 'Fianza' },
        { value: 'reporte', label: 'Reporte' },
        { value: 'correspondencia', label: 'Correspondencia' },
        { value: 'evidencia', label: 'Evidencia' },
        { value: 'otro', label: 'Otro' },
    ];

    const confidentialityLevels = [
        { value: 1, label: 'Nivel 1 - Público (Información general)' },
        { value: 2, label: 'Nivel 2 - Interno (Uso interno)' },
        { value: 3, label: 'Nivel 3 - Confidencial (Clientes y casos)' },
        { value: 4, label: 'Nivel 4 - Restringido (Abogados senior)' },
        { value: 5, label: 'Nivel 5 - Secreto (Solo administradores)' },
    ];

    const removeFile = () => {
        setUploadedFile(null);
        setStep(0);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const steps = ['Seleccionar archivo', 'Información del documento'];

    return (
        <Box>
            {/* Header */}
            <Box display="flex" alignItems="center" mb={4}>
                <IconButton onClick={() => navigate('/documents')} sx={{ mr: 2 }}>
                    <BackIcon />
                </IconButton>
                <Box>
                    <Typography variant="h4" fontWeight="bold">
                        Subir Documento
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Agrega un nuevo documento al sistema de gestión
                    </Typography>
                </Box>
            </Box>

            {/* Stepper */}
            <Stepper activeStep={step} sx={{ mb: 4 }}>
                {steps.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {/* Contenido del paso 0: Selección de archivo */}
            {step === 0 && (
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Selecciona un archivo
                    </Typography>
                    <Typography variant="body2" color="textSecondary" mb={3}>
                        Arrastra y suelta tu archivo aquí o haz clic para seleccionarlo
                    </Typography>

                    <DropzoneContainer
                        {...getRootProps()}
                        isDragActive={isDragActive}
                        elevation={isDragActive ? 8 : 2}
                    >
                        <input {...getInputProps()} />
                        <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                        {isDragActive ? (
                            <Typography variant="h6" color="primary">
                                Suelta el archivo aquí...
                            </Typography>
                        ) : (
                            <>
                                <Typography variant="h6" gutterBottom>
                                    Arrastra tu archivo aquí
                                </Typography>
                                <Typography variant="body2" color="textSecondary" mb={2}>
                                    o haz clic para seleccionar
                                </Typography>
                            </>
                        )}
                        <Typography variant="caption" color="textSecondary">
                            Archivos soportados: PDF, DOC, DOCX, TXT, RTF, JPG, PNG, GIF
                        </Typography>
                        <Typography variant="caption" color="textSecondary" display="block">
                            Tamaño máximo: 50MB
                        </Typography>
                    </DropzoneContainer>

                    {/* Tipos de archivo permitidos */}
                    <Box mt={4}>
                        <Typography variant="subtitle2" gutterBottom>
                            Tipos de documentos aceptados:
                        </Typography>
                        <Grid container spacing={1}>
                            {documentTypes.map((type) => (
                                <Grid item key={type.value}>
                                    <Chip label={type.label} size="small" variant="outlined" />
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </Box>
            )}

            {/* Contenido del paso 1: Información del documento */}
            {step === 1 && uploadedFile && (
                <Box>
                    {/* Archivo seleccionado */}
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                                <Box display="flex" alignItems="center" gap={2}>
                                    <DocumentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
                                    <Box>
                                        <Typography variant="body1" fontWeight="medium">
                                            {uploadedFile.name}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {formatFileSize(uploadedFile.size)} • {uploadedFile.type}
                                        </Typography>
                                    </Box>
                                </Box>
                                <IconButton onClick={removeFile} color="error">
                                    <CloseIcon />
                                </IconButton>
                            </Box>
                        </CardContent>
                    </Card>

                    {/* Formulario */}
                    <Paper sx={{ p: 3 }}>
                        <form onSubmit={formik.handleSubmit}>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Nombre del documento"
                                        name="nombre_original"
                                        value={formik.values.nombre_original}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        error={formik.touched.nombre_original && Boolean(formik.errors.nombre_original)}
                                        helperText={formik.touched.nombre_original && formik.errors.nombre_original}
                                        required
                                    />
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth required>
                                        <InputLabel>Tipo de documento</InputLabel>
                                        <Select
                                            name="tipo_documento"
                                            value={formik.values.tipo_documento}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            error={formik.touched.tipo_documento && Boolean(formik.errors.tipo_documento)}
                                        >
                                            <MenuItem value="">
                                                <em>Seleccionar tipo</em>
                                            </MenuItem>
                                            {documentTypes.map((type) => (
                                                <MenuItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {formik.touched.tipo_documento && formik.errors.tipo_documento && (
                                            <Typography variant="caption" color="error">
                                                {formik.errors.tipo_documento}
                                            </Typography>
                                        )}
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12} md={6}>
                                    <FormControl fullWidth required>
                                        <InputLabel>Nivel de confidencialidad</InputLabel>
                                        <Select
                                            name="confidencialidad"
                                            value={formik.values.confidencialidad}
                                            onChange={formik.handleChange}
                                            onBlur={formik.handleBlur}
                                            error={formik.touched.confidencialidad && Boolean(formik.errors.confidencialidad)}
                                        >
                                            {confidentialityLevels.map((level) => (
                                                <MenuItem key={level.value} value={level.value}>
                                                    {level.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                        {formik.touched.confidencialidad && formik.errors.confidencialidad && (
                                            <Typography variant="caption" color="error">
                                                {formik.errors.confidencialidad}
                                            </Typography>
                                        )}
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="ID del caso (opcional)"
                                        name="caso_id"
                                        value={formik.values.caso_id}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        placeholder="Ej: LAW-2024-001"
                                        helperText="Asocia este documento a un caso específico"
                                    />
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Descripción (opcional)"
                                        name="descripcion"
                                        value={formik.values.descripcion}
                                        onChange={formik.handleChange}
                                        onBlur={formik.handleBlur}
                                        multiline
                                        rows={3}
                                        placeholder="Describe brevemente el contenido de este documento..."
                                    />
                                </Grid>

                                {/* Barra de progreso */}
                                {uploading && (
                                    <Grid item xs={12}>
                                        <Box mb={2}>
                                            <Typography variant="body2" gutterBottom>
                                                Subiendo documento... {uploadProgress}%
                                            </Typography>
                                            <LinearProgress
                                                variant="determinate"
                                                value={uploadProgress}
                                                sx={{ height: 8, borderRadius: 4 }}
                                            />
                                        </Box>
                                    </Grid>
                                )}

                                {/* Acciones */}
                                <Grid item xs={12}>
                                    <Box display="flex" gap={2} justifyContent="flex-end">
                                        <Button
                                            variant="outlined"
                                            onClick={() => setStep(0)}
                                            disabled={uploading}
                                        >
                                            Atrás
                                        </Button>
                                        <Button
                                            variant="contained"
                                            type="submit"
                                            disabled={uploading}
                                            startIcon={<UploadIcon />}
                                        >
                                            {uploading ? 'Subiendo...' : 'Subir Documento'}
                                        </Button>
                                    </Box>
                                </Grid>
                            </Grid>
                        </form>
                    </Paper>

                    {/* Nota de seguridad */}
                    <Alert severity="info" sx={{ mt: 3 }}>
                        <Typography variant="body2">
                            <strong>Nota de seguridad:</strong> Todos los documentos son encriptados automáticamente
                            antes de ser almacenados en el sistema. El nivel de confidencialidad determina quiénes
                            tendrán acceso al documento.
                        </Typography>
                    </Alert>
                </Box>
            )}
        </Box>
    );
};

export default DocumentUpload;
