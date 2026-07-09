import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import toast from 'react-hot-toast'
import api from 'src/configs/api'

import Button from 'src/components/atoms/Button'
import Icon from 'src/components/atoms/Icon'
import AccountSelect, { Account } from 'src/components/molecules/AccountSelect'
import FormField from 'src/components/molecules/FormField'

const typeOptions = [
  { value: 'COMPRA', label: 'Compra' },
  { value: 'VENTA', label: 'Venta' }
]

const docTypeOptions = [
  { value: 'FACTURA', label: 'Factura' },
  { value: 'NOTA_DEBITO', label: 'Nota de Débito' },
  { value: 'NOTA_CREDITO', label: 'Nota de Crédito' }
]

const vatRateOptions = [
  { value: 16.00, label: '16% (General)' },
  { value: 8.00, label: '8% (Reducida)' },
  { value: 0.00, label: 'Exento / 0%' }
]

const vatWithholdingOptions = [
  { value: 75.00, label: '75%' },
  { value: 100.00, label: '100%' }
]

const islrWithholdingOptions = [
  { value: 1.00, label: '1% (Servicios PJ)' },
  { value: 2.00, label: '2% (Servicios Especiales / Fletes)' },
  { value: 3.00, label: '3% (Honorarios Profesionales)' },
  { value: 5.00, label: '5% (Otros Conceptos)' }
]

const TaxDocumentForm: React.FC = () => {
  const { activeCompany } = useSelector((state: RootState) => state.company)

  // Form Fields
  const [type, setType] = useState<'COMPRA' | 'VENTA'>('COMPRA')
  const [documentType, setDocumentType] = useState<'FACTURA' | 'NOTA_DEBITO' | 'NOTA_CREDITO'>('FACTURA')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [controlNumber, setControlNumber] = useState('')
  const [rif, setRif] = useState('')
  const [name, setName] = useState('')
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10))
  const [subtotal, setSubtotal] = useState<number>(0)
  const [vatRate, setVatRate] = useState<number>(16.00)
  
  // Withholdings State
  const [applyVatWithholding, setApplyVatWithholding] = useState(false)
  const [vatWithholdingRate, setVatWithholdingRate] = useState<number>(75.00)
  const [applyIslrWithholding, setApplyIslrWithholding] = useState(false)
  const [islrWithholdingRate, setIslrWithholdingRate] = useState<number>(2.00)
  
  // Account mappings
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  
  const [submitting, setSubmitting] = useState(false)

  // Real-Time Calculations
  const [calcVatAmount, setCalcVatAmount] = useState(0)
  const [calcTotal, setCalcTotal] = useState(0)
  const [calcVatWithholdingAmount, setCalcVatWithholdingAmount] = useState(0)
  const [calcIslrWithholdingAmount, setCalcIslrWithholdingAmount] = useState(0)
  const [calcNetToPayOrCollect, setCalcNetToPayOrCollect] = useState(0)

  useEffect(() => {
    // 1. VAT Amount
    const vat = subtotal * (vatRate / 100)
    setCalcVatAmount(vat)

    // 2. Total Invoice
    const total = subtotal + vat
    setCalcTotal(total)

    // 3. VAT Withholding
    const vatWithheld = applyVatWithholding ? vat * (vatWithholdingRate / 100) : 0
    setCalcVatWithholdingAmount(vatWithheld)

    // 4. ISLR Withholding
    const islrWithheld = applyIslrWithholding ? subtotal * (islrWithholdingRate / 100) : 0
    setCalcIslrWithholdingAmount(islrWithheld)

    // 5. Net to Pay or Collect
    const net = total - vatWithheld - islrWithheld
    setCalcNetToPayOrCollect(net)
  }, [subtotal, vatRate, applyVatWithholding, vatWithholdingRate, applyIslrWithholding, islrWithholdingRate])

  const handleSaveDocument = async () => {
    if (!activeCompany) {
      toast.error('Debe seleccionar una empresa activa')
      
return
    }
    if (!invoiceNumber || !controlNumber || !rif || !name) {
      toast.error('Número de Factura, Control, RIF y Razón Social son requeridos')
      
return
    }
    if (subtotal <= 0) {
      toast.error('El subtotal debe ser mayor a 0')
      
return
    }
    if (!selectedAccount) {
      toast.error(type === 'COMPRA' ? 'Debe seleccionar una cuenta de gasto' : 'Debe seleccionar una cuenta de ingreso')
      
return
    }

    setSubmitting(true)
    try {
      const requestBody = {
        type,
        documentType,
        invoiceNumber,
        controlNumber,
        rif,
        name,
        date: new Date(date).toISOString(),
        subtotal,
        vatRate,
        applyVatWithholding,
        vatWithholdingRate: applyVatWithholding ? vatWithholdingRate : undefined,
        applyIslrWithholding,
        islrWithholdingRate: applyIslrWithholding ? islrWithholdingRate : undefined,
        autoPost: true,
        expenseAccountId: type === 'COMPRA' ? selectedAccount.id : undefined,
        revenueAccountId: type === 'VENTA' ? selectedAccount.id : undefined
      }

      await api.post(`/companies/${activeCompany.id}/tax-documents`, requestBody)
      toast.success('Documento fiscal registrado con éxito (Asiento contable autogenerado)')
      
      // Reset Form
      setInvoiceNumber('')
      setControlNumber('')
      setRif('')
      setName('')
      setSubtotal(0)
      setApplyVatWithholding(false)
      setApplyIslrWithholding(false)
      setSelectedAccount(null)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar el documento fiscal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Registrar Documento Fiscal (Factura)" subheader="Gestión e impuestas y retenciones SENIAT en tiempo real" />
      <CardContent>
        {activeCompany ? (
          <Grid container spacing={4}>
            {/* Form Column */}
            <Grid item xs={12} md={8}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Tipo de Documento *"
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value as 'COMPRA' | 'VENTA')
                      setSelectedAccount(null) // clear account mapping since type changed
                    }}
                  >
                    {typeOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Subtipo de Documento *"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value as any)}
                  >
                    {docTypeOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormField
                    label="Número de Factura *"
                    placeholder="Ej. F-001004"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormField
                    label="Número de Control *"
                    placeholder="Ej. C-998822"
                    value={controlNumber}
                    onChange={(e) => setControlNumber(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormField
                    label="RIF (Cliente/Proveedor) *"
                    placeholder="Ej. J-99887766-5"
                    value={rif}
                    onChange={(e) => setRif(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormField
                    label="Razón Social / Nombre *"
                    placeholder="Ej. Distribuidora Industrial, C.A."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Fecha de Emisión *"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <AccountSelect
                    label={type === 'COMPRA' ? 'Cuenta de Gasto (Débito) *' : 'Cuenta de Ingreso (Abono) *'}
                    value={selectedAccount}
                    onChange={setSelectedAccount}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormField
                    label="Monto Subtotal Base *"
                    type="number"
                    placeholder="0.00"
                    value={subtotal === 0 ? '' : subtotal}
                    onChange={(e) => setSubtotal(parseFloat(e.target.value) || 0)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Alícuota de IVA *"
                    value={vatRate}
                    onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                  >
                    {vatRateOptions.map(opt => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Withholdings section */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }}>Retenciones Fiscales</Divider>
                </Grid>

                {/* VAT Withholding */}
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={applyVatWithholding}
                        onChange={(e) => setApplyVatWithholding(e.target.checked)}
                      />
                    }
                    label="Aplicar Retención de IVA"
                  />
                  {applyVatWithholding && (
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Porcentaje de IVA a Retener"
                        value={vatWithholdingRate}
                        onChange={(e) => setVatWithholdingRate(parseFloat(e.target.value) || 75)}
                      >
                        {vatWithholdingOptions.map(opt => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  )}
                </Grid>

                {/* ISLR Withholding */}
                <Grid item xs={12} sm={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={applyIslrWithholding}
                        onChange={(e) => setApplyIslrWithholding(e.target.checked)}
                      />
                    }
                    label="Aplicar Retención de ISLR"
                  />
                  {applyIslrWithholding && (
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        select
                        fullWidth
                        size="small"
                        label="Concepto de Retención ISLR"
                        value={islrWithholdingRate}
                        onChange={(e) => setIslrWithholdingRate(parseFloat(e.target.value) || 2)}
                      >
                        {islrWithholdingOptions.map(opt => (
                          <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Grid>

            {/* Live Calculation Sidebar Column */}
            <Grid item xs={12} md={4}>
              <Box sx={{ p: 4, bgcolor: 'background.default', borderRadius: 1, border: 1, borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="h6" sx={{ mb: 4, fontWeight: 600 }}>
                    Totales Fiscales (Real-Time)
                  </Typography>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Monto Base (Subtotal):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {subtotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Monto IVA ({vatRate}%):</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {calcVatAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Monto Total Factura:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {calcTotal.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  {/* Withholdings details if checked */}
                  {applyVatWithholding && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" color="error.main">Retención IVA ({vatWithholdingRate}%):</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                        -{calcVatWithholdingAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.
                      </Typography>
                    </Box>
                  )}

                  {applyIslrWithholding && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" color="error.main">Retención ISLR ({islrWithholdingRate}%):</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'error.main' }}>
                        -{calcIslrWithholdingAmount.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.
                      </Typography>
                    </Box>
                  )}

                  {(applyVatWithholding || applyIslrWithholding) && <Divider sx={{ my: 3 }} />}

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {type === 'COMPRA' ? 'Neto a Pagar:' : 'Neto a Cobrar:'}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {calcNetToPayOrCollect.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ mt: 4 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSaveDocument}
                    loading={submitting}
                    disabled={subtotal <= 0 || !selectedAccount}
                    startIcon={<Icon icon="mdi:calculator-variant" />}
                  >
                    Registrar y Asentar
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Icon icon="mdi:office-building-marker-outline" fontSize="3rem" sx={{ color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Selecciona una empresa en la barra superior para registrar documentos fiscales
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default TaxDocumentForm
