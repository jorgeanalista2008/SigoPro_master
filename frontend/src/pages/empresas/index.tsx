import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
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

import Button from 'src/components/atoms/Button'
import Icon from 'src/components/atoms/Icon'
import Badge from 'src/components/atoms/Badge'
import CompanyFormModal from 'src/components/organisms/CompanyFormModal'

const EmpresasPage = () => {
  const { companies, loading } = useSelector((state: RootState) => state.company)
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Mis Empresas (Multi-Tenant)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Administra las empresas asociadas a tu cuenta. El plan de cuentas VEN-NIF se creará automáticamente para cada nueva empresa.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Icon icon="mdi:office-building-plus" />}
            onClick={() => setModalOpen(true)}
          >
            Registrar Empresa
          </Button>
        </Box>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            {loading && companies.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <Typography>Cargando empresas...</Typography>
              </Box>
            ) : companies.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre / Razón Social</TableCell>
                      <TableCell>RIF</TableCell>
                      <TableCell>Dirección</TableCell>
                      <TableCell>Teléfono</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {companies.map((company) => (
                      <TableRow key={company.id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{company.name}</TableCell>
                        <TableCell>{company.rif}</TableCell>
                        <TableCell>{company.address || 'N/A'}</TableCell>
                        <TableCell>{company.phone || 'N/A'}</TableCell>
                        <TableCell>
                          {company.isActive ? (
                            <Badge label="Activa" color="success" variant="filled" />
                          ) : (
                            <Badge label="Inactiva" color="error" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Icon icon="mdi:office-building-off-outline" fontSize="3rem" sx={{ color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary">No tienes empresas registradas. Registra tu primera empresa para comenzar.</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      <CompanyFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </Grid>
  )
}

export default EmpresasPage
