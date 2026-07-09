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
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Chip from '@mui/material/Chip'
import toast from 'react-hot-toast'

import api from 'src/configs/api'

import Button from 'src/components/atoms/Button'
import Icon from 'src/components/atoms/Icon'

interface Permission {
  id: string
  name: string
  description: string
}

interface Role {
  id: string
  name: string
  createdAt: string
  permissions: Permission[]
}

const permissionGroupNames: Record<string, string> = {
  tenant: 'Administración de Cuenta (Tenant)',
  company: 'Empresas',
  user: 'Usuarios',
  role: 'Roles y Seguridad',
  invoice: 'Facturación e IVA',
  retention: 'Retenciones ISLR/IVA',
  txt: 'Portal SENIAT (Declaraciones TXT)',
  accounting: 'Contabilidad (Plan de Cuentas y Asientos)'
}

const RolesPage = () => {
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  
  // Modals state
  const [modalOpen, setModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  
  // Role form states
  const [roleName, setRoleName] = useState('')
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        api.get<Role[]>('/roles'),
        api.get<Permission[]>('/roles/permissions')
      ])
      setRoles(rolesRes.data || [])
      setPermissions(permissionsRes.data || [])
    } catch (error) {
      console.error('Error loading roles data:', error)
      toast.error('Error al cargar la información de perfiles y permisos')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleTogglePermission = (id: string) => {
    setSelectedPermissionIds(prev =>
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    )
  }

  const handleCreateRole = async () => {
    if (!roleName) {
      toast.error('El nombre del rol es obligatorio')
      
      return
    }
    setSaving(true)
    try {
      await api.post('/roles', {
        name: roleName,
        permissionIds: selectedPermissionIds
      })
      toast.success('Rol creado con éxito')
      setModalOpen(false)
      setRoleName('')
      setSelectedPermissionIds([])
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear el rol')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenEdit = (role: Role) => {
    setSelectedRole(role)
    setRoleName(role.name)
    setSelectedPermissionIds(role.permissions.map(p => p.id))
    setEditModalOpen(true)
  }

  const handleUpdateRole = async () => {
    if (!selectedRole) return
    setSaving(true)
    try {
      await api.patch(`/roles/${selectedRole.id}`, {
        name: roleName,
        permissionIds: selectedPermissionIds
      })
      toast.success('Rol actualizado con éxito')
      setEditModalOpen(false)
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar el rol')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (role: Role) => {
    if (role.name === 'Administrador') {
      toast.error('El rol de Administrador por defecto del sistema no puede ser eliminado')
      
      return
    }
    if (confirm(`¿Está seguro de que desea eliminar el rol "${role.name}"? Esta acción no se puede deshacer.`)) {
      try {
        await api.delete(`/roles/${role.id}`)
        toast.success('Rol eliminado con éxito')
        loadData()
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Error al eliminar el rol')
      }
    }
  }

  // Helper to group permissions by their prefix (e.g. "accounting:read" -> "accounting")
  const getGroupedPermissions = () => {
    const grouped: Record<string, Permission[]> = {}
    
    permissions.forEach(perm => {
      const prefix = perm.name.split(':')[0]
      if (!grouped[prefix]) {
        grouped[prefix] = []
      }
      grouped[prefix].push(perm)
    })
    
    return grouped
  }

  const groupedPermissions = getGroupedPermissions()

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Roles y Perfiles de Acceso
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configura los perfiles de acceso de tu tenant asignando permisos específicos del sistema.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Icon icon="mdi:shield-plus" />}
            onClick={() => {
              setRoleName('')
              setSelectedPermissionIds([])
              setModalOpen(true)
            }}
          >
            Nuevo Rol
          </Button>
        </Box>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardHeader title="Perfiles Configurados" titleTypographyProps={{ variant: 'h6', fontWeight: 600 }} />
          <CardContent>
            {loading && roles.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress size={30} />
              </Box>
            ) : roles.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ width: '20%' }}>Nombre del Rol</TableCell>
                      <TableCell sx={{ width: '65%' }}>Permisos Asignados</TableCell>
                      <TableCell align="center" sx={{ width: '15%' }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roles.map(r => (
                      <TableRow key={r.id} hover>
                        <TableCell sx={{ fontWeight: 600, verticalAlign: 'top', pt: 3 }}>
                          {r.name}
                        </TableCell>
                        <TableCell sx={{ py: 3 }}>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                            {r.permissions.length > 0 ? (
                              r.permissions.map(p => (
                                <Chip
                                  key={p.id}
                                  label={p.description || p.name}
                                  size="small"
                                  color="primary"
                                  variant="outlined"
                                />
                              ))
                            ) : (
                              <Typography variant="caption" color="text.disabled">Sin permisos asociados</Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ verticalAlign: 'top', pt: 2 }}>
                          <IconButton size="small" onClick={() => handleOpenEdit(r)} color="primary">
                            <Icon icon="mdi:pencil-outline" />
                          </IconButton>
                          {r.name !== 'Administrador' && (
                            <IconButton size="small" onClick={() => handleDelete(r)} color="error">
                              <Icon icon="mdi:trash-can-outline" />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Icon icon="mdi:shield-off-outline" fontSize="3rem" sx={{ color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary">No hay roles personalizados registrados en el tenant.</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      {/* Create / Edit Dialog Helper */}
      <Dialog 
        open={modalOpen || editModalOpen} 
        onClose={() => {
          setModalOpen(false)
          setEditModalOpen(false)
        }} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {modalOpen ? 'Crear Rol Personalizado' : 'Editar Rol / Permisos'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 6, pt: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Nombre del Rol"
              placeholder="Ej. Auditor Senior, Asistente Contable"
              value={roleName}
              onChange={e => setRoleName(e.target.value)}
              disabled={selectedRole?.name === 'Administrador'}
            />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 3 }}>
                Asignar Permisos del Sistema
              </Typography>
              
              {Object.keys(groupedPermissions).map(groupKey => {
                const groupTitle = permissionGroupNames[groupKey] || `Módulo ${groupKey.toUpperCase()}`
                const perms = groupedPermissions[groupKey]
                
                return (
                  <Box key={groupKey} sx={{ mb: 6 }}>
                    <Typography 
                      variant="body2" 
                      color="primary.main" 
                      sx={{ fontWeight: 600, mb: 2, pb: 1, borderBottom: 1, borderColor: 'divider' }}
                    >
                      {groupTitle}
                    </Typography>
                    <Grid container spacing={3}>
                      {perms.map(p => {
                        const isChecked = selectedPermissionIds.includes(p.id)
                        
                        return (
                          <Grid item xs={12} sm={6} md={4} key={p.id}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={isChecked}
                                  onChange={() => handleTogglePermission(p.id)}
                                  size="small"
                                  disabled={selectedRole?.name === 'Administrador'}
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {p.description || p.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {p.name}
                                  </Typography>
                                </Box>
                              }
                            />
                          </Grid>
                        )
                      })}
                    </Grid>
                  </Box>
                )
              })}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 6, pb: 6, pt: 4 }}>
          <Button 
            variant="outlined" 
            color="secondary" 
            onClick={() => {
              setModalOpen(false)
              setEditModalOpen(false)
            }}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            loading={saving} 
            onClick={modalOpen ? handleCreateRole : handleUpdateRole}
          >
            {modalOpen ? 'Crear Rol' : 'Guardar Cambios'}
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  )
}

RolesPage.acl = {
  action: 'manage',
  subject: 'all'
}

export default RolesPage
