import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import toast from 'react-hot-toast'
import api from 'src/configs/api'

import Button from 'src/components/atoms/Button'
import Icon from 'src/components/atoms/Icon'

const currentYear = new Date().getFullYear()
const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i)

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

const GenerarTxtPage = () => {
  const { activeCompany } = useSelector((state: RootState) => state.company)
  const [year, setYear] = useState<number>(currentYear)
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1)
  const [loading, setLoading] = useState(false)

  const handleGenerateTXT = async () => {
    if (!activeCompany) {
      toast.error('Debe seleccionar una empresa activa primero')
      
      return
    }

    setLoading(true)
    try {
      // 1. Fetch Purchases Book for the selected month/year
      const response = await api.get(`/companies/${activeCompany.id}/fiscal-books/COMPRA`, {
        params: { year, month }
      })

      const purchases = response.data || []
      
      // Filter purchases that have VAT withholding applied
      const withHoldingItems = purchases.filter((p: any) => p.applyVatWithholding || p.vatWithheld > 0)

      if (withHoldingItems.length === 0) {
        toast.error('No se encontraron retenciones de IVA aplicadas en el período seleccionado')
        setLoading(false)
        
        return
      }

      // 2. Generate SENIAT TXT content
      // Format RIF: strip dashes and convert to uppercase
      const agentRif = activeCompany.rif.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
      const period = `${year}${month.toString().padStart(2, '0')}`

      let txtContent = ''

      withHoldingItems.forEach((item: any, index: number) => {
        const supplierRif = item.rif.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
        const invoiceDate = new Date(item.date).toISOString().split('T')[0]
        
        // SENIAT details format:
        // RIF_Agente;Periodo;Fecha_Factura;Tipo_Operacion;Tipo_Documento;RIF_Sujeto_Retenido;Num_Factura;Num_Control;Monto_Total;Base_Imponible;IVA_Retenido;Factura_Afectada;Voucher;Monto_Exento;Alicuota;Num_Expediente
        const row = [
          agentRif,
          period,
          invoiceDate,
          'C', // C = Compra
          '01', // 01 = Factura
          supplierRif,
          item.invoiceNumber,
          item.controlNumber,
          (item.subtotal + item.vatAmount).toFixed(2),
          item.subtotal.toFixed(2),
          item.vatWithheld.toFixed(2),
          '0', // No affected invoice
          item.retentionVoucherNumber || `${period}${(index + 1).toString().padStart(5, '0')}`,
          '0.00', // Exempt amount
          item.vatRate ? item.vatRate.toFixed(2) : '16.00',
          '0' // Expedient Number
        ].join('\t') // Tab or semicolon-separated format depending on SENIAT specifications. SENIAT standard uses Tabs.

        txtContent += row + '\r\n'
      })

      // 3. Trigger File Download
      const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `RET_IVA_${agentRif}_${period}.txt`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('Archivo TXT de retenciones SENIAT generado y descargado con éxito')
    } catch (error) {
      console.error('Error generating TXT file:', error)
      toast.error('Error al generar el archivo de retenciones')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Grid container spacing={6}>
      <Grid item xs={12} md={8} lg={6}>
        <Card>
          <CardHeader 
            title="Generación TXT - IVA SENIAT" 
            titleTypographyProps={{ variant: 'h6', fontWeight: 600 }}
            subheader="Exporta la declaración mensual de retenciones de IVA en formato oficial TXT para el portal del SENIAT"
          />
          <CardContent>
            {activeCompany ? (
              <Box>
                <Grid container spacing={4} sx={{ mb: 6 }}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Año Fiscal"
                      value={year}
                      onChange={e => setYear(Number(e.target.value))}
                      size="small"
                    >
                      {years.map(y => (
                        <MenuItem key={y} value={y}>
                          {y}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      select
                      fullWidth
                      label="Mes de Declaración"
                      value={month}
                      onChange={e => setMonth(Number(e.target.value))}
                      size="small"
                    >
                      {months.map(m => (
                        <MenuItem key={m.value} value={m.value}>
                          {m.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                </Grid>

                <Box 
                  sx={{ 
                    p: 4, 
                    mb: 6, 
                    borderRadius: 1, 
                    bgcolor: 'action.hover', 
                    border: '1px dashed',
                    borderColor: 'divider'
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon icon="mdi:information-outline" fontSize="1.15rem" />
                    Detalles del Agente de Retención
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>Razón Social:</strong> {activeCompany.name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <strong>RIF:</strong> {activeCompany.rif}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Período a Declarar:</strong> {months.find(m => m.value === month)?.label} {year}
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  loading={loading}
                  startIcon={<Icon icon="mdi:file-download-outline" />}
                  onClick={handleGenerateTXT}
                >
                  Generar y Descargar Archivo TXT
                </Button>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <Icon icon="mdi:office-building-off-outline" fontSize="2.5rem" sx={{ color: 'text.disabled', mb: 2 }} />
                <Typography color="text.secondary">Debe seleccionar una empresa activa en el menú superior para poder generar el archivo TXT de retenciones.</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}

export default GenerarTxtPage
