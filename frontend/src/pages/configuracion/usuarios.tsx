import React, { useEffect, useState, useCallback } from 'react'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
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
import { useAuth } from 'src/hooks/useAuth'

import Button from 'src/components/atoms/Button'
import Icon from 'src/components/atoms/Icon'
import Badge from 'src/components/atoms/Badge'
import FormField from 'src/components/molecules/FormField'

interface Role {
  id: string
  name: string
}

interface User {
  id: string
  name: string
  email: string
  status: string
  isSuperAdmin: boolean
  createdAt: string
  role: Role
}

const statusOptions = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' }
]

const schema = yup.object().shape({
  name: yup.string().required('El nombre completo es requerido'),
  email: yup.string().email('Debe ser un correo electrónico válido').required('El correo electrónico es requerido'),
  password: yup
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .matches(
      /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
      'Debe contener mayúscula, minúscula y número/caracter especial'
    )
    .required('La contraseña es requerida'),
  roleId: yup.string().required('Debe seleccionar un rol para el usuario')
})

const UsuariosPage = () => {
  const auth = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  
  // Edit Form state
  const [editName, setEditName] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editStatus, setEditStatus] = useState('ACTIVE')
  const [editRoleId, setEditRoleId] = useState('')
  const [editPassword, setEditPassword] = useState('')
  
  const [submitting, setSubmitting] = useState(false)
  const [updating, setUpdating] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      roleId: ''
    }
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get<User[]>('/users'),
        api.get<Role[]>('/roles')
      ])
      setUsers(usersRes.data || [])
      setRoles(rolesRes.data || [])
    } catch (error) {
      console.error('Error al cargar datos:', error)
      toast.error('Error al cargar la lista de usuarios y roles')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const onSubmit = async (data: any) => {
    setSubmitting(true)
    try {
      await api.post('/users', data)
      toast.success('Usuario registrado con éxito')
      setModalOpen(false)
      reset()
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar el usuario')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user)
    setEditName(user.name)
    setEditEmail(user.email)
    setEditStatus(user.status)
    setEditRoleId(user.role.id)
    setEditPassword('')
    setEditModalOpen(true)
  }

  const handleUpdate = async () => {
    if (!selectedUser) return
    setUpdating(true)
    try {
      const payload: any = {
        name: editName,
        email: editEmail,
        status: editStatus,
        roleId: editRoleId
      }
      if (editPassword) {
        payload.password = editPassword
      }
      await api.patch(`/users/${selectedUser.id}`, payload)
      toast.success('Usuario actualizado con éxito')
      setEditModalOpen(false)
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar usuario')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async (user: User) => {
    if (user.id === auth.user?.id) {
      toast.error('No puedes darte de baja a ti mismo')
      
      return
    }
    if (confirm(`¿Está seguro de que desea eliminar permanentemente al usuario ${user.name}?`)) {
      try {
        await api.delete(`/users/${user.id}`)
        toast.success('Usuario eliminado del sistema')
        loadData()
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Error al eliminar usuario')
      }
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Gestión de Usuarios
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Agrega colaboradores (Contadores, Auxiliares) a tu tenant y asigna perfiles de acceso correspondientes.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Icon icon="mdi:account-multiple-plus" />}
            onClick={() => setModalOpen(true)}
          >
            Nuevo Usuario
          </Button>
        </Box>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="Colaboradores del Tenant" titleTypographyProps={{ variant: 'h6', fontWeight: 600 }} />
          <CardContent>
            {loading && users.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={30} />
              </Box>
            ) : users.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Correo Electrónico</TableCell>
                      <TableCell>Rol / Perfil</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell>Fecha Registro</TableCell>
                      <TableCell align="center">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {users.map(u => (
                      <TableRow key={u.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>
                          <Badge label={u.role.name} color="primary" />
                        </TableCell>
                        <TableCell>
                          {u.status === 'ACTIVE' ? (
                            <Badge label="Activo" color="success" variant="filled" />
                          ) : (
                            <Badge label="Inactivo" color="error" />
                          )}
                        </TableCell>
                        <TableCell>{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => handleOpenEdit(u)} color="primary">
                            <Icon icon="mdi:pencil-outline" />
                          </IconButton>
                          <IconButton size="small" onClick={() => handleDelete(u)} color="error">
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
                <Icon icon="mdi:account-multiple-outline" fontSize="3rem" sx={{ color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary">No tienes usuarios registrados en tu equipo.</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Create User Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Nuevo Colaborador</DialogTitle>
        <DialogContent dividers>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pt: 2 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Nombre Completo"
                    error={errors.name?.message}
                    {...field}
                  />
                )}
              />
              
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <FormField
                    type="email"
                    label="Correo Electrónico"
                    error={errors.email?.message}
                    {...field}
                  />
                )}
              />

              <Controller
                name="password"
                control={control}
                render={({ field }) => (
                  <FormField
                    type="password"
                    label="Contraseña"
                    error={errors.password?.message}
                    {...field}
                  />
                )}
              />

              <Controller
                name="roleId"
                control={control}
                render={({ field }) => (
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Rol / Perfil"
                    error={!!errors.roleId}
                    helperText={errors.roleId?.message}
                    {...field}
                  >
                    {roles.map(r => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.name}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Box>
            
            <DialogActions sx={{ px: 0, pb: 0, pt: 6 }}>
              <Button variant="outlined" color="secondary" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="contained" loading={submitting}>
                Crear Usuario
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Editar Usuario</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, pt: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Nombre Completo"
              value={editName}
              onChange={e => setEditName(e.target.value)}
            />
            
            <TextField
              fullWidth
              type="email"
              size="small"
              label="Correo Electrónico"
              value={editEmail}
              onChange={e => setEditEmail(e.target.value)}
            />

            <TextField
              fullWidth
              type="password"
              size="small"
              label="Cambiar Contraseña (Opcional)"
              placeholder="Dejar vacío para no modificar"
              value={editPassword}
              onChange={e => setEditPassword(e.target.value)}
            />

            <TextField
              select
              fullWidth
              size="small"
              label="Rol / Perfil"
              value={editRoleId}
              onChange={e => setEditRoleId(e.target.value)}
            >
              {roles.map(r => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              fullWidth
              size="small"
              label="Estado de Acceso"
              value={editStatus}
              onChange={e => setEditStatus(e.target.value)}
            >
              {statusOptions.map(opt => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
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

UsuariosPage.acl = {
  action: 'manage',
  subject: 'all'
}

export default UsuariosPage
