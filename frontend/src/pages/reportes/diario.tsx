import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Alert from '@mui/material/Alert'
import CircularProgress from '@mui/material/CircularProgress'
import toast from 'react-hot-toast'
import api from 'src/configs/api'
import Icon from 'src/components/atoms/Icon'

const formatVenezuelaDate = (dateString: string) => {
  const d = new Date(dateString)
  return d.toLocaleDateString('es-VE', { timeZone: 'UTC' })
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-VE', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

const LibroDiarioPage = () => {
  const { activeCompany } = useSelector((state: RootState) => state.company)
  
  // Set defaults: first day of month to today
  const today = new Date().toISOString().split('T')[0]
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(firstDayOfMonth)
  const [endDate, setEndDate] = useState(today)
  const [loading, setLoading] = useState(false)
  const [entries, setEntries] = useState<any[]>([])

  const fetchJournalBook = async () => {
    if (!activeCompany) return

    setLoading(true)
    try {
      const response = await api.get(`/companies/${activeCompany.id}/reports/journal`, {
        params: { startDate, endDate }
      })
      setEntries(response.data || [])
    } catch (error: any) {
      toast.error('Error al cargar el Libro Diario')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeCompany) {
      fetchJournalBook()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCompany])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchJournalBook()
  }

  const handlePrint = () => {
    window.print()
  }

  if (!activeCompany) {
    return (
      <Alert severity='warning' variant='outlined'>
        Debe seleccionar una empresa activa primero para consultar el Libro Diario.
      </Alert>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} className='no-print'>
        <Card>
          <CardHeader title='Filtros de Búsqueda - Libro Diario' />
          <CardContent>
            <form onSubmit={handleSearch}>
              <Grid container spacing={4} alignItems='center'>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type='date'
                    label='Fecha Inicio'
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    type='date'
                    label='Fecha Fin'
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box display='flex' gap={2}>
                    <Button
                      fullWidth
                      type='submit'
                      variant='contained'
                      startIcon={<Icon icon='tabler:search' />}
                      disabled={loading}
                    >
                      Buscar
                    </Button>
                    <Button
                      variant='outlined'
                      color='secondary'
                      onClick={handlePrint}
                      disabled={loading || entries.length === 0}
                    >
                      <Icon icon='tabler:printer' />
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <Box
            sx={{
              p: 6,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center'
            }}
          >
            <Typography variant='h5' sx={{ mb: 1, fontWeight: 600 }}>
              {activeCompany.name}
            </Typography>
            <Typography variant='body2' sx={{ mb: 1, color: 'text.secondary' }}>
              RIF: {activeCompany.rif.toUpperCase()}
            </Typography>
            <Typography variant='h6' sx={{ mb: 4, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Libro Diario
            </Typography>
            <Typography variant='body2' sx={{ color: 'text.secondary' }}>
              Período: {formatVenezuelaDate(startDate)} al {formatVenezuelaDate(endDate)}
            </Typography>
          </Box>

          <CardContent>
            {loading ? (
              <Box display='flex' justifyContent='center' my={10}>
                <CircularProgress />
              </Box>
            ) : entries.length === 0 ? (
              <Alert severity='info'>No se encontraron asientos registrados en este período.</Alert>
            ) : (
              <TableContainer component={Paper} variant='outlined'>
                <Table size='small' sx={{ minWidth: 650 }}>
                  <TableHead sx={{ backgroundColor: 'action.hover' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: '12%' }}>Fecha</TableCell>
                      <TableCell sx={{ fontWeight: 600, width: '15%' }}>Código</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Cuenta / Concepto</TableCell>
                      <TableCell align='right' sx={{ fontWeight: 600, width: '15%' }}>Debe</TableCell>
                      <TableCell align='right' sx={{ fontWeight: 600, width: '15%' }}>Haber</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entries.map((entry: any) => (
                      <React.Fragment key={entry.id}>
                        {/* Header of the journal entry */}
                        <TableRow sx={{ backgroundColor: 'action.selected', '& td': { fontWeight: 600 } }}>
                          <TableCell>{formatVenezuelaDate(entry.date)}</TableCell>
                          <TableCell colSpan={2}>
                            Asiento #{entry.number} - {entry.description}
                          </TableCell>
                          <TableCell align='right' colSpan={2}>
                            Ref: {entry.reference || 'N/A'}
                          </TableCell>
                        </TableRow>

                        {/* Lines of the journal entry */}
                        {entry.lines.map((line: any) => (
                          <TableRow key={line.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell></TableCell>
                            <TableCell>{line.account.code}</TableCell>
                            <TableCell sx={{ pl: line.credit > 0 ? 8 : 4 }}>
                              {line.account.name}
                              {line.description && (
                                <Typography variant='caption' display='block' sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                                  — {line.description}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell align='right' sx={{ color: line.debit > 0 ? 'inherit' : 'text.disabled' }}>
                              {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                            </TableCell>
                            <TableCell align='right' sx={{ color: line.credit > 0 ? 'inherit' : 'text.disabled' }}>
                              {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Grid>
      
      {/* Print-specific style override */}
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background-color: #fff !important;
          }
          .MuiCard-root {
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>
    </Grid>
  )
}

export default LibroDiarioPage
