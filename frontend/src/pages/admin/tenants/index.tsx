import React, { useEffect, useState, useCallback } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import toast from 'react-hot-toast'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import api from 'src/configs/api'

import Button from 'src/components/atoms/Button'
import Icon from 'src/components/atoms/Icon'
import Badge from 'src/components/atoms/Badge'
import FormField from 'src/components/molecules/FormField'

interface Tenant {
  id: string
  name: string
  rif: string
  plan: string
  status: string
  expiresAt: string
  createdAt: string
}

const planOptions = [
  { value: 'BASIC', label: 'Básico (Basic)' },
  { value: 'PREMIUM', label: 'Premium' },
  { value: 'ENTERPRISE', label: 'Corporativo (Enterprise)' }
]

const statusOptions = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'SUSPENDED', label: 'Suspendido' },
  { value: 'INACTIVE', label: 'Inactivo' }
]

const schema = yup.object().shape({
  name: yup.string().required('El nombre de la empresa/suscriptor es requerido'),
  rif: yup
    .string()
    .required('El RIF es requerido')
    .matches(/^[JGVECjgvec]-\d{8}-\d$/, 'RIF inválido (ej. J-12345678-9)'),
  plan: yup.string().required('Debe elegir un plan'),
  expiresAt: yup.string().required('La fecha de vencimiento es requerida'),
  adminName: yup.string().required('El nombre del administrador es requerido'),
  adminEmail: yup.string().email('Debe ser un correo válido').required('El correo electrónico es requerido'),
  adminPassword: yup
    .string()
    .min(8, 'Debe tener al menos 8 caracteres')
    .matches(
      /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
      'Debe contener mayúscula, minúscula y número/caracter especial'
    )
    .required('La contraseña es requerida')
})

const TenantsAdminPage = () => {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  
  // Edit Form state
  const [editName, setEditName] = useState('')
  const [editPlan, setEditPlan] = useState('BASIC')
  const [editStatus, setEditStatus] = useState('ACTIVE')
  const [editExpiresAt, setEditExpiresAt] = useState('')
  const [updating, setUpdating] = useState(false)
  const [creating, setCreating] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      rif: '',
      plan: 'BASIC',
      expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      adminName: '',
      adminEmail: '',
      adminPassword: ''
    }
  })

  const loadTenants = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get<Tenant[]>('/tenants')
      setTenants(response.data || [])
    } catch (error) {
      console.error('Error al cargar suscripciones:', error)
      toast.error('Error al cargar la lista de suscriptores (Tenants)')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTenants()
  }, [loadTenants])

  const onSubmit = async (data: any) => {
    setCreating(true)
    try {
      await api.post('/tenants', {
        ...data,
        expiresAt: new Date(data.expiresAt).toISOString()
      })
      toast.success('Suscripción y Administrador registrados con éxito')
      setModalOpen(false)
      reset()
      loadTenants()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar la membresía')
    } finally {
      setCreating(false)
    }
  }

  const handleOpenEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant)
    setEditName(tenant.name)
    setEditPlan(tenant.plan)
    setEditStatus(tenant.status)
    setEditExpiresAt(new Date(tenant.expiresAt).toISOString().split('T')[0])
    setEditModalOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedTenant) return
    setUpdating(true)
    try {
      await api.patch(`/tenants/${selectedTenant.id}`, {
        name: editName,
        plan: editPlan,
        status: editStatus,
        expiresAt: new Date(editExpiresAt).toISOString()
      })
      toast.success('Membresía actualizada con éxito')
      setEditModalOpen(false)
      loadTenants()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Está seguro de que desea eliminar permanentemente esta suscripción (Tenant)? Se borrarán todas las empresas y datos contables vinculados.')) {
      try {
        await api.delete(`/tenants/${id}`)
        toast.success('Suscripción eliminada del sistema')
        loadTenants()
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Error al eliminar')
      }
    }
  }

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'ENTERPRISE':
        return <Badge label="Enterprise" color="primary" variant="filled" />
      case 'PREMIUM':
        return <Badge label="Premium" color="warning" variant="filled" />
      default:
        return <Badge label="Basic" color="info" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge label="Activo" color="success" variant="filled" />
      case 'SUSPENDED':
        return <Badge label="Suspendido" color="error" variant="filled" />
      default:
        return <Badge label="Inactivo" color="error" />
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Administración de Membresías y Tenants
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gestiona el acceso multi-tenant del SaaS Contable. Registra firmas, asigna planes de suscripción y administra estados de cuentas.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Icon icon="mdi:account-plus" />}
            onClick={() => setModalOpen(true)}
          >
            Registrar Suscriptor
          </Button>
        </Box>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            {loading && tenants.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={30} />
              </Box>
            ) : tenants.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre Suscriptor</TableCell>
                      <TableCell>RIF</TableCell>
                      <TableCell>Plan Contratado</TableCell>
                      <TableCell>Estado de Cuenta</TableCell>
                      <TableCell>Vence el</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tenants.map(tenant => (
                      <TableRow key={tenant.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{tenant.name}</TableCell>
                        <TableCell>{tenant.rif}</TableCell>
                        <TableCell>{getPlanBadge(tenant.plan)}</TableCell>
                        <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                        <TableCell>{new Date(tenant.expiresAt).toLocaleDateString()}</TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => handleOpenEdit(tenant)} color="primary">
                            <Icon icon="mdi:pencil-outline" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(tenant.id)} color="error">
                            <Icon icon="mdi:trash-can-outline" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Icon icon="mdi:shield-alert-outline" fontSize="3rem" sx={{ color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary">No hay suscriptores registrados en el sistema.</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Register Tenant Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Registrar Suscripción y Cliente</DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Typography variant="subtitle2" sx={{ mb: 4, fontWeight: 600, color: 'primary.main' }}>
              1. Datos de Suscripción (Tenant)
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <FormField
                      label="Razón Social / Firma Contable"
                      error={errors.name?.message}
                      {...field}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="rif"
                  control={control}
                  render={({ field }) => (
                    <FormField
                      label="RIF (ej. J-12345678-9)"
                      placeholder="J-12345678-9"
                      error={errors.rif?.message}
                      {...field}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="plan"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Plan de Membresía"
                      error={!!errors.plan}
                      helperText={errors.plan?.message}
                      sx={{ mb: 4 }}
                      {...field}
                    >
                      {planOptions.map(opt => (
                        <MenuItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="expiresAt"
                  control={control}
                  render={({ field }) => (
                    <FormField
                      type="date"
                      label="Fecha de Vencimiento de Membresía"
                      error={errors.expiresAt?.message}
                      {...field}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ my: 4, fontWeight: 600, color: 'primary.main' }}>
              2. Datos del Administrador del Suscriptor
            </Typography>
            <Grid container spacing={4}>
              <Grid item xs={12}>
                <Controller
                  name="adminName"
                  control={control}
                  render={({ field }) => (
                    <FormField
                      label="Nombre Completo"
                      error={errors.adminName?.message}
                      {...field}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="adminEmail"
                  control={control}
                  render={({ field }) => (
                    <FormField
                      type="email"
                      label="Correo Electrónico"
                      error={errors.adminEmail?.message}
                      {...field}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="adminPassword"
                  control={control}
                  render={({ field }) => (
                    <FormField
                      type="password"
                      label="Contraseña"
                      error={errors.adminPassword?.message}
                      {...field}
                    />
                  )}
                />
              </Grid>
            </Grid>

            <DialogActions sx={{ px: 0, pb: 0, pt: 6 }}>
              <Button variant="outlined" color="secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" loading={creating}>
                Registrar
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Tenant Modal */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Editar Suscripción</DialogTitle>
        <DialogContent dividers sx={{ pb: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pt: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Firma Contable / Cliente"
              value={editName}
              onChange={e => setEditName(e.target.value)}
            />
            
            <TextField
              select
              fullWidth
              size="small"
              label="Plan"
              value={editPlan}
              onChange={e => setEditPlan(e.target.value)}
            >
              {planOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              size="small"
              label="Estado"
              value={editStatus}
              onChange={e => setEditStatus(e.target.value)}
            >
              {statusOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="date"
              fullWidth
              size="small"
              label="Vence el"
              InputLabelProps={{ shrink: true }}
              value={editExpiresAt}
              onChange={e => setEditExpiresAt(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 6, pb: 6 }}>
          <Button variant="outlined" color="secondary" onClick={() => setEditModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="contained" loading={updating} onClick={handleUpdate}>
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

// Map component metadata to allow full access under Super Admin Guard
TenantsAdminPage.acl = {
  action: 'manage',
  subject: 'all'
}

export default TenantsAdminPage
