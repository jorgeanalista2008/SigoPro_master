import React, { useEffect, useState } from 'react'
import { useAuth } from 'src/hooks/useAuth'
import { useRouter } from 'next/router'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CardHeader from '@mui/material/CardHeader'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Avatar from '@mui/material/Avatar'
import api from 'src/configs/api'

import Badge from 'src/components/atoms/Badge'
import Icon from 'src/components/atoms/Icon'

const SaaSGlobalDashboard = () => {
  const auth = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalCompanies: 0,
    totalUsers: 0,
    tenantsList: [] as any[]
  })

  useEffect(() => {
    if (auth.user && !auth.user.isSuperAdmin) {
      router.replace('/dashboards/analytics')
      
      return
    }

    const fetchSaaSStats = async () => {
      try {
        const response = await api.get('/tenants')
        const list = response.data || []
        
        const totalTenants = list.length
        const activeTenants = list.filter((t: any) => t.status === 'ACTIVE').length
        const totalCompanies = list.reduce((acc: number, t: any) => acc + (t.companyCount || 0), 0)
        const totalUsers = list.reduce((acc: number, t: any) => acc + (t.userCount || 0), 0)

        setStats({
          totalTenants,
          activeTenants,
          totalCompanies,
          totalUsers,
          tenantsList: list.slice(0, 5)
        })
      } catch (err) {
        console.error('Error fetching SaaS stats:', err)
      } finally {
        setLoading(false)
      }
    }

    if (auth.user?.isSuperAdmin) {
      fetchSaaSStats()
    }
  }, [auth.user, router])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress size={40} />
      </Box>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
          Panel de Control - Super Administrador
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Métricas consolidadas de la infraestructura multi-tenant de SaaS Contable.
        </Typography>
      </Grid>

      {/* KPI Cards */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ borderLeft: 5, borderColor: 'primary.main' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main', width: 48, height: 48 }}>
              <Icon icon="mdi:account-group" fontSize="1.5rem" />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{stats.totalTenants}</Typography>
              <Typography variant="caption" color="text.secondary">Total Suscriptores</Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ borderLeft: 5, borderColor: 'success.main' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Avatar sx={{ bgcolor: 'success.light', color: 'success.main', width: 48, height: 48 }}>
              <Icon icon="mdi:account-check" fontSize="1.5rem" />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{stats.activeTenants}</Typography>
              <Typography variant="caption" color="text.secondary">Suscripciones Activas</Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ borderLeft: 5, borderColor: 'info.main' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Avatar sx={{ bgcolor: 'info.light', color: 'info.main', width: 48, height: 48 }}>
              <Icon icon="mdi:office-building" fontSize="1.5rem" />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{stats.totalCompanies}</Typography>
              <Typography variant="caption" color="text.secondary">Empresas Registradas</Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ borderLeft: 5, borderColor: 'warning.main' }}>
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main', width: 48, height: 48 }}>
              <Icon icon="mdi:users" fontSize="1.5rem" />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>{stats.totalUsers}</Typography>
              <Typography variant="caption" color="text.secondary">Usuarios del Sistema</Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* Latest Registrations */}
      <Grid item xs={12} md={8}>
        <Card>
          <CardHeader title="Últimos Clientes Registrados" titleTypographyProps={{ variant: 'h6', fontWeight: 600 }} />
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Firma Contable</TableCell>
                    <TableCell>RIF</TableCell>
                    <TableCell>Plan</TableCell>
                    <TableCell>Empresas</TableCell>
                    <TableCell>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.tenantsList.map((t: any) => (
                    <TableRow key={t.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{t.name}</TableCell>
                      <TableCell>{t.rif}</TableCell>
                      <TableCell>
                        <Badge 
                          label={t.plan} 
                          color={t.plan === 'ENTERPRISE' ? 'primary' : t.plan === 'PREMIUM' ? 'warning' : 'info'}
                          variant="filled" 
                        />
                      </TableCell>
                      <TableCell>{t.companyCount || 0} empresas</TableCell>
                      <TableCell>
                        <Badge 
                          label={t.status === 'ACTIVE' ? 'Activo' : 'Suspendido'} 
                          color={t.status === 'ACTIVE' ? 'success' : 'error'}
                          variant="filled" 
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={4}>
        <Card>
          <CardHeader title="Información de Soporte" titleTypographyProps={{ variant: 'h6', fontWeight: 600 }} />
          <CardContent>
            <Typography variant="body2" sx={{ mb: 4 }}>
              Como Super Administrador, tus operaciones impactan la configuración global y la facturación de los suscriptores de la plataforma.
            </Typography>
            <Box sx={{ p: 4, borderRadius: 1, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Icon icon="mdi:shield-lock-outline" fontSize="1.15rem" />
                Seguridad Global
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Las claves de los administradores de los tenants se crean encriptadas. Asegúrate de notificar a tus clientes sus credenciales tras el registro.
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

SaaSGlobalDashboard.acl = {
  action: 'manage',
  subject: 'all'
}

export default SaaSGlobalDashboard
