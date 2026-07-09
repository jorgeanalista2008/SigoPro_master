import React, { useState, useEffect, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import toast from 'react-hot-toast'
import api from 'src/configs/api'

import Button from 'src/components/atoms/Button'
import Icon from 'src/components/atoms/Icon'

interface FiscalBookItem {
  id: string
  date: string
  rif: string
  name: string
  invoiceNumber: string
  controlNumber: string
  subtotal: number
  vatAmount: number
  vatWithholdingAmount?: number
  islrWithholdingAmount?: number
  total: number
  netToPayOrCollect: number
}

interface FiscalBookTableProps {
  type: 'compras' | 'ventas'
}

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 5 }, (_, i) => currentYear - i)
const months = [
  { value: 1, label: 'Enero' },
  { value: 2, label: 'Febrero' },
  { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' },
  { value: 5, label: 'Mayo' },
  { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' },
  { value: 8, label: 'Agosto' },
  { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' },
  { value: 11, label: 'Noviembre' },
  { value: 12, label: 'Diciembre' }
]

const FiscalBookTable: React.FC<FiscalBookTableProps> = ({ type }) => {
  const { activeCompany } = useSelector((state: RootState) => state.company)
  
  const [year, setYear] = useState<number>(currentYear)
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [items, setItems] = useState<FiscalBookItem[]>([])
  const [loading, setLoading] = useState(false)

  const loadFiscalBook = useCallback(async () => {
    if (!activeCompany) return
    setLoading(true)
    try {
      const response = await api.get<FiscalBookItem[]>(
        `/companies/${activeCompany.id}/fiscal-books/${type}`,
        {
          params: { year, month }
        }
      )

      setItems(response.data)
    } catch (error) {
      console.error(`Error loading fiscal book ${type}:`, error)
      toast.error('Error al cargar el libro fiscal')
    } finally {
      setLoading(false)
    }
  }, [activeCompany, type, year, month])

  useEffect(() => {
    loadFiscalBook()
  }, [loadFiscalBook])

  const handlePrint = () => {
    window.print()
  }

  // Book summary totals
  const totalSubtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0)
  const totalVat = items.reduce((sum, item) => sum + (item.vatAmount || 0), 0)
  const totalVatWithheld = items.reduce((sum, item) => sum + (item.vatWithholdingAmount || 0), 0)
  const totalIslrWithheld = items.reduce((sum, item) => sum + (item.islrWithholdingAmount || 0), 0)
  const totalNet = items.reduce((sum, item) => sum + (item.netToPayOrCollect || 0), 0)

  return (
    <Card className="printable-card">
      <CardHeader
        title={type === 'compras' ? 'Libro de Compras Fiscal (SENIAT)' : 'Libro de Ventas Fiscal (SENIAT)'}
        subheader={`Resumen cronológico de operaciones correspondientes al período seleccionado`}
        action={
          <Button
            variant="outlined"
            onClick={handlePrint}
            disabled={items.length === 0}
            startIcon={<Icon icon="mdi:printer" />}
            className="no-print"
          >
            Imprimir Libro
          </Button>
        }
      />
      <CardContent>
        {activeCompany ? (
          <>
            {/* Filters */}
            <Box className="no-print" sx={{ mb: 6 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Año"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                  >
                    {years.map(y => (
                      <MenuItem key={y} value={y}>
                        {y}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Mes"
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                  >
                    {months.map(m => (
                      <MenuItem key={m.value} value={m.value}>
                        {m.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : items.length > 0 ? (
              <TableContainer component={Paper} variant="outlined" sx={{ overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 1000 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Fecha</TableCell>
                      <TableCell>RIF</TableCell>
                      <TableCell>Razón Social / Nombre</TableCell>
                      <TableCell>Factura</TableCell>
                      <TableCell>Control</TableCell>
                      <TableCell align="right">Base Imponible</TableCell>
                      <TableCell align="right">IVA</TableCell>
                      <TableCell align="right">IVA Retenido</TableCell>
                      <TableCell align="right">ISLR Retenido</TableCell>
                      <TableCell align="right">Neto</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{new Date(item.date).toLocaleDateString('es-VE')}</TableCell>
                        <TableCell>{item.rif}</TableCell>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.invoiceNumber}</TableCell>
                        <TableCell>{item.controlNumber}</TableCell>
                        <TableCell align="right">
                          {item.subtotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell align="right">
                          {item.vatAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell align="right">
                          {item.vatWithholdingAmount ? item.vatWithholdingAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : '0,00'}
                        </TableCell>
                        <TableCell align="right">
                          {item.islrWithholdingAmount ? item.islrWithholdingAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 }) : '0,00'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {item.netToPayOrCollect.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Totals Row */}
                    <TableRow sx={{ bgcolor: 'action.hover', '& td': { fontWeight: 700 } }}>
                      <TableCell colSpan={5}>TOTALES GENERALES</TableCell>
                      <TableCell align="right">
                        {totalSubtotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right">
                        {totalVat.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right">
                        {totalVatWithheld.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right">
                        {totalIslrWithheld.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'primary.main' }}>
                        {totalNet.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography color="text.secondary">
                  No existen registros fiscales para el período {months.find(m => m.value === month)?.label} - {year}.
                </Typography>
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Icon icon="mdi:office-building-marker-outline" fontSize="3rem" sx={{ color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Selecciona una empresa en la barra superior para ver los libros fiscales
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Global CSS for Printing */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-card, .printable-card * {
            visibility: visible;
          }
          .printable-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </Card>
  )
}

export default FiscalBookTable
