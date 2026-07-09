import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
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

const LibroMayorPage = () => {
  const { activeCompany } = useSelector((state: RootState) => state.company)
  
  // Dates default setup
  const today = new Date().toISOString().split('T')[0]
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

  const [startDate, setStartDate] = useState(firstDayOfMonth)
  const [endDate, setEndDate] = useState(today)
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<any[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [ledgerData, setLedgerData] = useState<any>(null)

  // 1. Fetch transactional accounts for the select input
  const fetchAccounts = async () => {
    if (!activeCompany) return
    try {
      const response = await api.get(`/companies/${activeCompany.id}/accounts`)
      const list = response.data || []
      // Only transactional accounts can have ledger items
      const transactional = list.filter((a: any) => a.isTransactional)
      setAccounts(transactional)
      if (transactional.length > 0) {
        setSelectedAccountId(transactional[0].id)
      }
    } catch (error) {
      toast.error('Error al cargar la lista de cuentas contables')
      console.error(error)
    }
  }

  // 2. Fetch General Ledger for selected account
  const fetchLedger = async () => {
    if (!activeCompany || !selectedAccountId) return

    setLoading(true)
    try {
      const response = await api.get(`/companies/${activeCompany.id}/reports/ledger`, {
        params: { accountId: selectedAccountId, startDate, endDate }
      })
      setLedgerData(response.data || null)
    } catch (error) {
      toast.error('Error al cargar el Libro Mayor')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeCompany) {
      fetchAccounts()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCompany])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccountId) {
      toast.error('Por favor seleccione una cuenta contable')
      return
    }
    fetchLedger()
  }

  const handlePrint = () => {
    window.print()
  }

  if (!activeCompany) {
    return (
      <Alert severity='warning' variant='outlined'>
        Debe seleccionar una empresa activa primero para consultar el Libro Mayor.
      </Alert>
    )
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} className='no-print'>
        <Card>
          <CardHeader title='Filtros de Búsqueda - Libro Mayor' />
          <CardContent>
            <form onSubmit={handleSearch}>
              <Grid container spacing={4} alignItems='center'>
                <Grid item xs={12} sm={3}>
                  <TextField
                    select
                    fullWidth
                    label='Cuenta Contable'
                    value={selectedAccountId}
                    onChange={e => setSelectedAccountId(e.target.value)}
                  >
                    {accounts.map(acc => (
                      <MenuItem key={acc.id} value={acc.id}>
                        {acc.code} — {acc.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    type='date'
                    label='Fecha Inicio'
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <TextField
                    fullWidth
                    type='date'
                    label='Fecha Fin'
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={3}>
                  <Box display='flex' gap={2}>
                    <Button
                      fullWidth
                      type='submit'
                      variant='contained'
                      startIcon={<Icon icon='tabler:search' />}
                      disabled={loading || accounts.length === 0}
                    >
                      Buscar
                    </Button>
                    <Button
                      variant='outlined'
                      color='secondary'
                      onClick={handlePrint}
                      disabled={loading || !ledgerData}
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

      {ledgerData && (
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
              <Typography variant='h6' sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Libro Mayor Analítico
              </Typography>
              <Typography variant='subtitle1' sx={{ mb: 4, fontWeight: 500, color: 'primary.main' }}>
                Cuenta: {ledgerData.account.code} — {ledgerData.account.name} ({ledgerData.account.type})
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
                  <Table size='small' sx={{ minWidth: 650 }}>
                    <TableHead sx={{ backgroundColor: 'action.hover' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Fecha</TableCell>
                        <TableCell sx={{ fontWeight: 600, width: '10%' }}>Asiento #</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Concepto / Detalle</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Referencia</TableCell>
                        <TableCell align='right' sx={{ fontWeight: 600, width: '15%' }}>Débito</TableCell>
                        <TableCell align='right' sx={{ fontWeight: 600, width: '15%' }}>Crédito</TableCell>
                        <TableCell align='right' sx={{ fontWeight: 600, width: '15%' }}>Saldo</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {/* Initial Balance Row */}
                      <TableRow sx={{ fontStyle: 'italic', backgroundColor: 'action.hover' }}>
                        <TableCell colSpan={4} sx={{ fontWeight: 500 }}>
                          Saldo Inicial al {formatVenezuelaDate(startDate)}
                        </TableCell>
                        <TableCell align='right'>-</TableCell>
                        <TableCell align='right'>-</TableCell>
                        <TableCell align='right' sx={{ fontWeight: 600 }}>
                          {formatCurrency(ledgerData.initialBalance)}
                        </TableCell>
                      </TableRow>

                      {/* Transaction Rows */}
                      {ledgerData.lines.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} align='center' sx={{ py: 6 }}>
                            No hubo movimientos en el período seleccionado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        ledgerData.lines.map((line: any) => (
                          <TableRow key={line.id}>
                            <TableCell>{formatVenezuelaDate(line.date)}</TableCell>
                            <TableCell>#{line.entryNumber}</TableCell>
                            <TableCell>{line.description}</TableCell>
                            <TableCell>{line.reference || 'N/A'}</TableCell>
                            <TableCell align='right' sx={{ color: line.debit > 0 ? 'inherit' : 'text.disabled' }}>
                              {line.debit > 0 ? formatCurrency(line.debit) : '-'}
                            </TableCell>
                            <TableCell align='right' sx={{ color: line.credit > 0 ? 'inherit' : 'text.disabled' }}>
                              {line.credit > 0 ? formatCurrency(line.credit) : '-'}
                            </TableCell>
                            <TableCell align='right' sx={{ fontWeight: 500 }}>
                              {formatCurrency(line.balance)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}

                      {/* Final Balance Row */}
                      <TableRow sx={{ backgroundColor: 'action.selected', '& td': { fontWeight: 600 } }}>
                        <TableCell colSpan={4}>Saldo Final al {formatVenezuelaDate(endDate)}</TableCell>
                        <TableCell align='right'>
                          {formatCurrency(ledgerData.lines.reduce((sum: number, line: any) => sum + line.debit, 0))}
                        </TableCell>
                        <TableCell align='right'>
                          {formatCurrency(ledgerData.lines.reduce((sum: number, line: any) => sum + line.credit, 0))}
                        </TableCell>
                        <TableCell align='right' sx={{ color: 'primary.main', fontSize: '1rem' }}>
                          {formatCurrency(ledgerData.finalBalance)}
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

export default LibroMayorPage
