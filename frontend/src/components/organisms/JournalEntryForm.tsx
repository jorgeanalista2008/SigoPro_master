import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Grid from '@mui/material/Grid'
import TextField from '@mui/material/TextField'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import IconButton from '@mui/material/IconButton'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Paper from '@mui/material/Paper'
import toast from 'react-hot-toast'
import api from 'src/configs/api'

import Icon from 'src/components/atoms/Icon'
import Button from 'src/components/atoms/Button'
import AccountSelect, { Account } from 'src/components/molecules/AccountSelect'
import FormField from 'src/components/molecules/FormField'

interface JournalEntryLineInput {
  account: Account | null
  debit: number
  credit: number
  description: string
}

const JournalEntryForm: React.FC = () => {
  const { activeCompany } = useSelector((state: RootState) => state.company)

  // Header State
  const [date, setDate] = useState(new Date().toISOString().substring(0, 10))
  const [description, setDescription] = useState('')
  const [reference, setReference] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Lines State
  const [lines, setLines] = useState<JournalEntryLineInput[]>([
    { account: null, debit: 0, credit: 0, description: '' },
    { account: null, debit: 0, credit: 0, description: '' }
  ])

  const handleAddLine = () => {
    setLines([...lines, { account: null, debit: 0, credit: 0, description: '' }])
  }

  const handleRemoveLine = (index: number) => {
    if (lines.length <= 2) {
      toast.error('Un asiento contable requiere al menos 2 líneas (Partida Doble)')
      
return
    }
    const newLines = [...lines]
    newLines.splice(index, 1)
    setLines(newLines)
  }

  const handleLineChange = (index: number, field: keyof JournalEntryLineInput, value: any) => {
    const newLines = [...lines]
    
    if (field === 'debit') {
      const debitVal = parseFloat(value) || 0
      newLines[index].debit = debitVal
      if (debitVal > 0) {
        newLines[index].credit = 0 // Clear opposite side
      }
    } else if (field === 'credit') {
      const creditVal = parseFloat(value) || 0
      newLines[index].credit = creditVal
      if (creditVal > 0) {
        newLines[index].debit = 0 // Clear opposite side
      }
    } else {
      newLines[index] = {
        ...newLines[index],
        [field]: value
      }
    }
    
    setLines(newLines)
  }

  // Calculate Totals
  const totalDebit = lines.reduce((sum, line) => sum + line.debit, 0)
  const totalCredit = lines.reduce((sum, line) => sum + line.credit, 0)
  const difference = Math.abs(totalDebit - totalCredit)
  const isBalanced = totalDebit > 0 && totalCredit > 0 && difference < 0.01

  const handleSaveEntry = async () => {
    if (!activeCompany) {
      toast.error('Debe seleccionar una empresa activa')
      
return
    }
    if (!description) {
      toast.error('La descripción general del asiento es requerida')
      
return
    }
    if (!isBalanced) {
      toast.error('El asiento no cumple con el principio de Partida Doble (Débito != Crédito)')
      
return
    }

    // Validate account selection
    const invalidLine = lines.find(line => !line.account)
    if (invalidLine) {
      toast.error('Todas las líneas deben tener una cuenta contable asociada')
      
return
    }

    setSubmitting(true)
    try {
      const requestBody = {
        date: new Date(date).toISOString(),
        description,
        reference,
        lines: lines.map(line => ({
          accountId: line.account!.id,
          debit: line.debit,
          credit: line.credit,
          description: line.description || description // default to general description
        }))
      }

      await api.post(`/companies/${activeCompany.id}/journal-entries`, requestBody)
      toast.success('Asiento contable registrado con éxito')
      
      // Reset Form
      setDescription('')
      setReference('')
      setLines([
        { account: null, debit: 0, credit: 0, description: '' },
        { account: null, debit: 0, credit: 0, description: '' }
      ])
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrar el asiento contable')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader title="Registrar Asiento Diario" subheader="Comprobante contable de partida doble general" />
      <CardContent>
        {activeCompany ? (
          <Grid container spacing={4}>
            {/* Header info */}
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Fecha *"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormField
                label="Descripción General *"
                placeholder="Ej. Pago de alquiler de oficina o Compra de papelería"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                sx={{ mb: 0 }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormField
                label="Referencia / Soporte"
                placeholder="Ej. Transf-88992"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                sx={{ mb: 0 }}
              />
            </Grid>

            {/* Entry Lines */}
            <Grid item xs={12}>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell width="30%">Cuenta Contable *</TableCell>
                      <TableCell width="15%">Débito *</TableCell>
                      <TableCell width="15%">Crédito *</TableCell>
                      <TableCell width="35%">Descripción de la Línea (Opcional)</TableCell>
                      <TableCell width="5%" align="center">Acción</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lines.map((line, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <AccountSelect
                            value={line.account}
                            onChange={(account) => handleLineChange(idx, 'account', account)}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            placeholder="0.00"
                            value={line.debit === 0 ? '' : line.debit}
                            onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                            inputProps={{ step: 'any', min: 0 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            placeholder="0.00"
                            value={line.credit === 0 ? '' : line.credit}
                            onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                            inputProps={{ step: 'any', min: 0 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            fullWidth
                            size="small"
                            placeholder="Ej. Detalle de línea..."
                            value={line.description}
                            onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton color="error" size="small" onClick={() => handleRemoveLine(idx)}>
                            <Icon icon="mdi:trash-can-outline" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            {/* Footer / Actions */}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 4 }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Icon icon="mdi:plus" />}
                onClick={handleAddLine}
              >
                Añadir Línea
              </Button>

              {/* Totals Summary */}
              <Box sx={{ minWidth: 280, p: 4, bgcolor: 'background.default', borderRadius: 1, border: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Total Débitos:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {totalDebit.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="body2">Total Créditos:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {totalCredit.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: 1, pt: 2, borderColor: 'divider' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Diferencia:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: difference > 0 ? 'error.main' : 'success.main' }}>
                    {difference.toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                  </Typography>
                </Box>

                {totalDebit > 0 && totalCredit > 0 && (
                  <Box sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon
                      icon={isBalanced ? 'mdi:check-circle' : 'mdi:alert-circle'}
                      color={isBalanced ? 'success' : 'error'}
                    />
                    <Typography variant="caption" color={isBalanced ? 'success.main' : 'error.main'} sx={{ fontWeight: 600 }}>
                      {isBalanced ? 'Asiento Balanceado' : 'Asiento Descuadrado'}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Grid>

            {/* Save Button */}
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', borderTop: 1, borderColor: 'divider', pt: 4 }}>
              <Button
                variant="contained"
                onClick={handleSaveEntry}
                loading={submitting}
                disabled={!isBalanced}
                startIcon={<Icon icon="mdi:content-save-outline" />}
              >
                Registrar Asiento Contable
              </Button>
            </Grid>
          </Grid>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Icon icon="mdi:office-building-marker-outline" fontSize="3rem" sx={{ color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Selecciona una empresa en la barra superior para registrar asientos contables
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default JournalEntryForm
