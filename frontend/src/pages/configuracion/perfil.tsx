import React from 'react'
import { useAuth } from 'src/hooks/useAuth'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Avatar from '@mui/material/Avatar'

const PerfilPage = () => {
  const auth = useAuth()

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent sx={{ pt: 10, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
            <Avatar
              sx={{ width: 100, height: 100, mb: 4, fontSize: '2.5rem', bgcolor: 'primary.main' }}
            >
              {auth.user?.name ? auth.user.name[0].toUpperCase() : 'U'}
            </Avatar>
            <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
              {auth.user?.name || 'Nombre Usuario'}
            </Typography>
            <Typography variant="body2" sx={{ mb: 6 }} color="text.secondary">
              Rol: {auth.user?.role || 'Ninguno'}
            </Typography>
            
            <Box sx={{ width: '100%', borderTop: 1, borderColor: 'divider', pt: 4 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Correo Electrónico:</strong> {auth.user?.email || 'N/A'}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>ID de Usuario:</strong> {auth.user?.id || 'N/A'}
              </Typography>
              <Typography variant="body2">
                <strong>Estado de Cuenta:</strong> Activo
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default PerfilPage
