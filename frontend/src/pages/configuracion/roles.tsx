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
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Select from '@mui/material/Select'
import MenuItem from '@mui/material/MenuItem'
import InputLabel from '@mui/material/InputLabel'
import FormControl from '@mui/material/FormControl'
import InputAdornment from '@mui/material/InputAdornment'
import toast from 'react-hot-toast'

import api from 'src/configs/api'
import { useAuth } from 'src/hooks/useAuth'

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

const POPULAR_ICONS = [
  'tabler:smart-home', 'tabler:chart-pie',
  'tabler:users', 'tabler:shield-lock',
  'tabler:settings', 'tabler:database',
  'tabler:file-invoice', 'tabler:receipt',
  'tabler:file-code', 'tabler:scale',
  'tabler:file-text', 'tabler:book',
  'tabler:list-numbers', 'tabler:file-spreadsheet'
]

const RolesPage = () => {
  const auth = useAuth()
  const isSuperAdmin = auth.user?.isSuperAdmin

  const [activeTab, setActiveTab] = useState<'roles' | 'menus'>('roles')
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

  // Dynamic Menus States
  const [menus, setMenus] = useState<any[]>([])
  const [menuModalOpen, setMenuModalOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<any | null>(null)
  const [menuLabel, setMenuLabel] = useState('')
  const [menuRoute, setMenuRoute] = useState('')
  const [menuIcon, setMenuIcon] = useState('')
  const [menuOrder, setMenuOrder] = useState<number>(0)
  const [menuParentId, setMenuParentId] = useState<string>('')
  const [menuPermissionIds, setMenuPermissionIds] = useState<string[]>([])

  // Icon Selector States
  const [iconSelectorOpen, setIconSelectorOpen] = useState(false)
  const [iconSearchQuery, setIconSearchQuery] = useState('')
  const [iconSearchResults, setIconSearchResults] = useState<string[]>([])
  const [iconSearching, setIconSearching] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [rolesRes, permissionsRes] = await Promise.all([
        api.get<Role[]>('/roles'),
        api.get<Permission[]>('/roles/permissions')
      ])
      setRoles(rolesRes.data || [])
      setPermissions(permissionsRes.data || [])

      if (isSuperAdmin) {
        const menusRes = await api.get('/menu/all')
        setMenus(menusRes.data || [])
      }
    } catch (error) {
      console.error('Error loading roles/menus data:', error)
      toast.error('Error al cargar la información de perfiles, menús y permisos')
    } finally {
      setLoading(false)
    }
  }, [isSuperAdmin])

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

  // --- ACTIONS: MENUS ---
  const handleOpenMenuModal = (menuItem: any | null = null) => {
    if (menuItem) {
      setEditingMenu(menuItem)
      setMenuLabel(menuItem.title)
      setMenuRoute(menuItem.path || '')
      setMenuIcon(menuItem.icon || '')
      setMenuOrder(menuItem.order)
      setMenuParentId(menuItem.parentId || '')
      setMenuPermissionIds(menuItem.permissions.map((p: any) => p.id))
    } else {
      setEditingMenu(null)
      setMenuLabel('')
      setMenuRoute('')
      setMenuIcon('')
      setMenuOrder(menus.length + 1)
      setMenuParentId('')
      setMenuPermissionIds([])
    }
    setMenuModalOpen(true)
  }

  const handleSaveMenu = async () => {
    if (!menuLabel) {
      toast.error('El título del menú es obligatorio')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: menuLabel,
        path: menuRoute || undefined,
        icon: menuIcon || undefined,
        order: Number(menuOrder),
        parentId: menuParentId || undefined,
        permissionIds: menuPermissionIds
      }

      if (editingMenu) {
        await api.patch(`/menu/${editingMenu.id}`, payload)
        toast.success('Menú de navegación actualizado con éxito')
      } else {
        await api.post('/menu', payload)
        toast.success('Menú de navegación creado con éxito')
      }
      setMenuModalOpen(false)
      loadData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar el menú')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteMenu = async (menuItem: any) => {
    if (confirm(`¿Está seguro de que desea eliminar el menú "${menuItem.title}"? Esta acción no se puede deshacer.`)) {
      try {
        await api.delete(`/menu/${menuItem.id}`)
        toast.success('Menú eliminado con éxito')
        loadData()
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Error al eliminar el menú')
      }
    }
  }

  const handleToggleMenuPermission = (permId: string) => {
    setMenuPermissionIds(prev =>
      prev.includes(permId) ? prev.filter(id => id !== permId) : [...prev, permId]
    )
  }

  const handleSearchIcons = async (query: string) => {
    if (!query.trim()) {
      setIconSearchResults([])
      return
    }
    setIconSearching(true)
    try {
      // We search across mdi and tabler prefixes to support standard icon libraries
      const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=60`)
      if (res.ok) {
        const data = await res.json()
        setIconSearchResults(data.icons || [])
      }
    } catch (err) {
      console.error('Error searching icons:', err)
    } finally {
      setIconSearching(false)
    }
  }

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (iconSearchQuery) {
        handleSearchIcons(iconSearchQuery)
      } else {
        setIconSearchResults([])
      }
    }, 400)

    return () => clearTimeout(delayDebounceFn)
  }, [iconSearchQuery])

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
              {activeTab === 'roles' ? 'Roles y Perfiles de Acceso' : 'Menús Dinámicos de Navegación'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeTab === 'roles' 
                ? 'Configura los perfiles de acceso de tu tenant asignando permisos específicos del sistema.'
                : 'Configura las rutas, jerarquías e iconos de la barra lateral (Sidebar) del sistema.'}
            </Typography>
          </Box>
          {activeTab === 'roles' ? (
            <Button
              variant="contained"
              startIcon={<Icon icon="tabler:shield-plus" />}
              onClick={() => {
                setRoleName('')
                setSelectedPermissionIds([])
                setModalOpen(true)
              }}
            >
              Nuevo Rol
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<Icon icon="tabler:folder-plus" />}
              onClick={() => handleOpenMenuModal(null)}
            >
              Nuevo Menú
            </Button>
          )}
        </Box>
      </Grid>

      {isSuperAdmin && (
        <Grid item xs={12}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
            <Tabs
              value={activeTab}
              onChange={(_, val) => setActiveTab(val)}
              sx={{
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 650, fontSize: '0.95rem' },
                '& .Mui-selected': { color: 'primary.main' }
              }}
            >
              <Tab label="🔑 Perfiles y Permisos" value="roles" />
              <Tab label="📂 Menús de Navegación" value="menus" />
            </Tabs>
          </Box>
        </Grid>
      )}

      {activeTab === 'roles' ? (
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
                              <Icon icon="tabler:edit" />
                            </IconButton>
                            {r.name !== 'Administrador' && (
                              <IconButton size="small" onClick={() => handleDelete(r)} color="error">
                                <Icon icon="tabler:trash" />
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
                  <Box sx={{ color: 'text.disabled', mb: 2, display: 'inline-flex' }}>
                    <Icon icon="tabler:shield-off" width="48" height="48" />
                  </Box>
                  <Typography color="text.secondary">No hay roles personalizados registrados en el tenant.</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      ) : (
        <Grid item xs={12}>
          <Card>
            <CardHeader title="Estructura del Menú Lateral (Global)" titleTypographyProps={{ variant: 'h6', fontWeight: 600 }} />
            <CardContent>
              {loading && menus.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress size={30} />
                </Box>
              ) : menus.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '25%' }}>Etiqueta (Título)</TableCell>
                        <TableCell sx={{ width: '20%' }}>Ruta (Ruta de NextJS)</TableCell>
                        <TableCell sx={{ width: '10%' }} align="center">Icono</TableCell>
                        <TableCell sx={{ width: '8%' }} align="center">Orden</TableCell>
                        <TableCell sx={{ width: '27%' }}>Permisos Requeridos</TableCell>
                        <TableCell align="center" sx={{ width: '10%' }}>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {menus.map((item: any) => {
                        const parent = menus.find((m: any) => m.id === item.parentId)
                        
                        return (
                          <TableRow key={item.id} hover>
                            <TableCell sx={{ fontWeight: 600, pt: 3 }}>
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {item.title}
                                </Typography>
                                {parent && (
                                  <Typography variant="caption" color="text.disabled">
                                    Hijo de: {parent.title}
                                  </Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                              {item.path || <Chip label="Contenedor / Grupo" size="small" variant="outlined" />}
                            </TableCell>
                            <TableCell align="center">
                              {item.icon ? (
                                <Icon icon={item.icon} width="24" height="24" style={{ color: 'var(--primary)' }} />
                              ) : (
                                <Typography variant="caption" color="text.disabled">-</Typography>
                              )}
                            </TableCell>
                            <TableCell align="center" sx={{ fontWeight: 500 }}>{item.order}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {item.permissions.length > 0 ? (
                                  item.permissions.map((p: any) => (
                                    <Chip
                                      key={p.id}
                                      label={p.description || p.name}
                                      size="small"
                                      color="info"
                                      variant="outlined"
                                    />
                                  ))
                                ) : (
                                  <Chip label="Público (Sin permiso)" size="small" color="default" variant="outlined" />
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              <IconButton size="small" onClick={() => handleOpenMenuModal(item)} color="primary">
                                <Icon icon="tabler:edit" />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDeleteMenu(item)} color="error">
                                <Icon icon="tabler:trash" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Box sx={{ color: 'text.disabled', mb: 2, display: 'inline-flex' }}>
                    <Icon icon="tabler:folder-off" width="48" height="48" />
                  </Box>
                  <Typography color="text.secondary">No hay menús registrados en la plataforma.</Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Create / Edit Role Dialog */}
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

      {/* CREATE / EDIT MENU DIALOG */}
      <Dialog
        open={menuModalOpen}
        onClose={() => setMenuModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>
          {editingMenu ? `Editar Menú: ${menuLabel}` : 'Crear Nuevo Menú de Barra Lateral'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 5, pt: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="Título del Menú"
              placeholder="Ej. Libro Mayor, Compras"
              value={menuLabel}
              onChange={e => setMenuLabel(e.target.value)}
              required
            />

            <TextField
              fullWidth
              size="small"
              label="Ruta de NextJS"
              placeholder="Ej. /reportes/mayor (dejar vacío si es carpeta contenedora)"
              value={menuRoute}
              onChange={e => setMenuRoute(e.target.value)}
            />

            <Grid container spacing={4}>
              <Grid item xs={12} sm={8}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Icono (Iconify string)"
                    placeholder="Ej. tabler:chart-pie, tabler:users"
                    value={menuIcon}
                    onChange={e => setMenuIcon(e.target.value)}
                    InputProps={{
                      startAdornment: menuIcon ? (
                        <InputAdornment position="start">
                          <Icon icon={menuIcon} width="20" height="20" style={{ color: 'var(--primary)' }} />
                        </InputAdornment>
                      ) : null
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setIconSearchQuery('')
                      setIconSearchResults([])
                      setIconSelectorOpen(true)
                    }}
                    startIcon={<Icon icon="tabler:palette" />}
                    sx={{ height: '40px', minWidth: '110px' }}
                  >
                    Buscar
                  </Button>
                </Box>
              </Grid>

              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label="Orden"
                  placeholder="Ej. 1"
                  value={menuOrder}
                  onChange={e => setMenuOrder(Number(e.target.value))}
                  required
                />
              </Grid>
            </Grid>

            <FormControl fullWidth size="small">
              <InputLabel id="parent-menu-label">Menú Padre (Para Submenús)</InputLabel>
              <Select
                labelId="parent-menu-label"
                value={menuParentId}
                label="Menú Padre (Para Submenús)"
                onChange={e => setMenuParentId(e.target.value)}
              >
                <MenuItem value="">-- Ninguno (Raíz) --</MenuItem>
                {menus
                  .filter((m: any) => !m.parentId && (!editingMenu || m.id !== editingMenu.id))
                  .map((m: any) => (
                    <MenuItem key={m.id} value={m.id}>{m.title}</MenuItem>
                  ))}
              </Select>
            </FormControl>

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 3 }}>
                Permisos Requeridos (El usuario debe tener al menos uno de ellos)
              </Typography>
              <Grid container spacing={2}>
                {permissions.map(p => {
                  const isChecked = menuPermissionIds.includes(p.id)
                  
                  return (
                    <Grid item xs={12} sm={6} key={p.id}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isChecked}
                            onChange={() => handleToggleMenuPermission(p.id)}
                            size="small"
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
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 6, pb: 6, pt: 4 }}>
          <Button variant="outlined" color="secondary" onClick={() => setMenuModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="contained" loading={saving} onClick={handleSaveMenu}>
            Guardar Menú
          </Button>
        </DialogActions>
      </Dialog>

      {/* ICON SELECTOR MODAL */}
      <Dialog
        open={iconSelectorOpen}
        onClose={() => setIconSelectorOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Seleccionar Icono (Iconify API)
          </Typography>
          <IconButton onClick={() => setIconSelectorOpen(false)}>
            <Icon icon="tabler:x" width="20" height="20" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 4 }}>
            <TextField
              fullWidth
              size="small"
              label="Buscar iconos (ej: home, chart, report, settings, lock...)"
              placeholder="Escribe el nombre del icono para buscar..."
              value={iconSearchQuery}
              onChange={e => setIconSearchQuery(e.target.value)}
            />
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 3, fontWeight: 600, color: 'text.secondary' }}>
            {iconSearchQuery ? 'Resultados de la búsqueda' : 'Iconos populares sugeridos'}
          </Typography>

          {iconSearching ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress size={30} />
            </Box>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                gap: 2,
                maxHeight: '350px',
                overflowY: 'auto',
                p: 2
              }}
            >
              {(iconSearchQuery ? iconSearchResults : POPULAR_ICONS).map(iconName => (
                <Button
                  key={iconName}
                  onClick={() => {
                    setMenuIcon(iconName)
                    setIconSelectorOpen(false)
                  }}
                  variant="outlined"
                  sx={{
                    flexDirection: 'column',
                    minHeight: '75px',
                    borderRadius: '6px',
                    p: 2,
                    textTransform: 'none',
                    borderColor: 'divider',
                    color: 'text.primary',
                    gap: 1.5,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: 'action.hover',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  <Icon icon={iconName} width="24" height="24" style={{ color: 'var(--primary)' }} />
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.65rem',
                      color: 'text.secondary',
                      textAlign: 'center',
                      wordBreak: 'break-all',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}
                  >
                    {iconName.split(':').pop()}
                  </Typography>
                </Button>
              ))}
              {iconSearchQuery && iconSearchResults.length === 0 && (
                <Box sx={{ gridColumn: '1 / -1', textAlign: 'center', py: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    No se encontraron iconos para "{iconSearchQuery}"
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 6, pb: 6, pt: 4 }}>
          <Button variant="outlined" color="secondary" onClick={() => setIconSelectorOpen(false)}>
            Cerrar
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
