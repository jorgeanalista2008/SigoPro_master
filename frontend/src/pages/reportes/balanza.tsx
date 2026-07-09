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
  if (value === 0) return '-'
  return new Intl.NumberFormat('es-VE', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
}

const BalanzaComprobacionPage = () => {
  const { activeCompany } = useSelector((state: RootState) => state.company)
  
  // Date range setup
  const today = new Date().toISOString().split('T')[0]
  const firstDayOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(firstDayOfYear)
  const [endDate, setEndDate] = useState(today)
  const [loading, setLoading] = useState(false)
  const [balanceData, setBalanceData] = useState<any>(null)

  const fetchTrialBalance = async () => {
    if (!activeCompany) return

    setLoading(true)
    try {
      const response = await api.get(`/companies/${activeCompany.id}/reports/trial-balance`, {
        params: { startDate, endDate }
      })
      setBalanceData(response.data || null)
    } catch (error) {
      toast.error('Error al cargar la Balanza de Comprobación')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeCompany) {
      fetchTrialBalance()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCompany])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTrialBalance()
  }

  const handlePrint = () => {
    window.print()
  }

  if (!activeCompany) {
    return (
      <Alert severity='warning' variant='outlined'>
        Debe seleccionar una empresa activa primero para consultar la Balanza de Comprobación.
      </Alert>
    )
  }

  // Helper to split single balance value into debit/credit columns depending on nature
  const getDebitCreditColumns = (val: number, isDebitNature: boolean) => {
    let deudor = 0
    let acreedor = 0
    if (isDebitNature) {
      if (val >= 0) deudor = val
      else acreedor = Math.abs(val)
    } else {
      if (val >= 0) acreedor = val
      else deudor = Math.abs(val)
    }
    
    return { deudor, acreedor }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} className='no-print'>
        <Card>
          <CardHeader title='Filtros de Búsqueda - Balanza de Comprobación' />
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
                      disabled={loading || !balanceData}
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

      {balanceData && (
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
                Balanza de Comprobación
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
              ) : (
                <TableContainer component={Paper} variant='outlined'>
                  <Table size='small' sx={{ minWidth: 800 }}>
                    <TableHead sx={{ backgroundColor: 'action.hover' }}>
                      {/* Main Category Headers */}
                      <TableRow>
                        <TableCell colSpan={2} sx={{ borderBottom: 0 }}></TableCell>
                        <TableCell align='center' colSpan={2} sx={{ fontWeight: 600, borderLeft: 1, borderColor: 'divider' }}>
                          Saldos Iniciales
                        </TableCell>
                        <TableCell align='center' colSpan={2} sx={{ fontWeight: 600, borderLeft: 1, borderColor: 'divider' }}>
                          Movimientos del Periodo
                        </TableCell>
                        <TableCell align='center' colSpan={2} sx={{ fontWeight: 600, borderLeft: 1, borderRight: 1, borderColor: 'divider' }}>
                          Saldos Finales
                        </TableCell>
                      </TableRow>
                      {/* Column Sub-headers */}
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, width: '10%' }}>Código</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Cuenta Contable</TableCell>
                        
                        <TableCell align='right' sx={{ fontWeight: 600, width: '12%', borderLeft: 1, borderColor: 'divider' }}>Deudor</TableCell>
                        <TableCell align='right' sx={{ fontWeight: 600, width: '12%' }}>Acreedor</TableCell>
                        
                        <TableCell align='right' sx={{ fontWeight: 600, width: '12%', borderLeft: 1, borderColor: 'divider' }}>Debe</TableCell>
                        <TableCell align='right' sx={{ fontWeight: 600, width: '12%' }}>Haber</TableCell>
                        
                        <TableCell align='right' sx={{ fontWeight: 600, width: '12%', borderLeft: 1, borderColor: 'divider' }}>Deudor</TableCell>
                        <TableCell align='right' sx={{ fontWeight: 600, width: '12%', borderRight: 1, borderColor: 'divider' }}>Acreedor</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {balanceData.rows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align='center' sx={{ py: 6 }}>
                            No se encontraron datos contables.
                          </TableCell>
                        </TableRow>
                      ) : (
                        balanceData.rows.map((row: any) => {
                          const initBalanceCols = getDebitCreditColumns(row.initialBalance, row.isDebitNature)
                          const finalBalanceCols = getDebitCreditColumns(row.finalBalance, row.isDebitNature)

                          return (
                            <TableRow key={row.accountId} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                              <TableCell sx={{ fontFamily: 'monospace' }}>{row.code}</TableCell>
                              <TableCell sx={{ fontWeight: 500 }}>{row.name}</TableCell>
                              
                              <TableCell align='right' sx={{ borderLeft: 1, borderColor: 'divider' }}>
                                {formatCurrency(initBalanceCols.deudor)}
                              </TableCell>
                              <TableCell align='right'>
                                {formatCurrency(initBalanceCols.acreedor)}
                              </TableCell>
                              
                              <TableCell align='right' sx={{ borderLeft: 1, borderColor: 'divider' }}>
                                {formatCurrency(row.debit)}
                              </TableCell>
                              <TableCell align='right'>
                                {formatCurrency(row.credit)}
                              </TableCell>
                              
                              <TableCell align='right' sx={{ borderLeft: 1, borderColor: 'divider' }}>
                                {formatCurrency(finalBalanceCols.deudor)}
                              </TableCell>
                              <TableCell align='right' sx={{ borderRight: 1, borderColor: 'divider' }}>
                                {formatCurrency(finalBalanceCols.acreedor)}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}

                      {/* Summary Totals Row */}
                      <TableRow sx={{ backgroundColor: 'action.selected', '& td': { fontWeight: 600 } }}>
                        <TableCell colSpan={2}>TOTALES</TableCell>
                        
                        <TableCell align='right' sx={{ borderLeft: 1, borderColor: 'divider' }}>
                          {formatCurrency(balanceData.totals.initialDebit)}
                        </TableCell>
                        <TableCell align='right'>
                          {formatCurrency(balanceData.totals.initialCredit)}
                        </TableCell>
                        
                        <TableCell align='right' sx={{ borderLeft: 1, borderColor: 'divider' }}>
                          {formatCurrency(balanceData.totals.debit)}
                        </TableCell>
                        <TableCell align='right'>
                          {formatCurrency(balanceData.totals.credit)}
                        </TableCell>
                        
                        <TableCell align='right' sx={{ borderLeft: 1, borderColor: 'divider', color: 'primary.main' }}>
                          {formatCurrency(balanceData.totals.finalDebit)}
                        </TableCell>
                        <TableCell align='right' sx={{ borderRight: 1, borderColor: 'divider', color: 'primary.main' }}>
                          {formatCurrency(balanceData.totals.finalCredit)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      )}
      
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

export default BalanzaComprobacionPage
