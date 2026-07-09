import React from 'react'
import { useDispatch } from 'react-redux'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Grid from '@mui/material/Grid'
import toast from 'react-hot-toast'
import { AppDispatch } from 'src/store'
import { createCompany } from 'src/store/apps/company'
import FormField from 'src/components/molecules/FormField'
import Button from 'src/components/atoms/Button'

interface CompanyFormInputs {
  name: string
  rif: string
  address?: string
  phone?: string
}

interface CompanyFormModalProps {
  open: boolean
  onClose: () => void
}

const rifRegExp = /^[JVEG]-[0-9]{8}-[0-9]$/

const schema = yup.object().shape({
  name: yup.string().required('El nombre es requerido'),
  rif: yup.string().required('El RIF es requerido').matches(rifRegExp, 'Formato RIF inválido (ej: J-12345678-9)'),
  address: yup.string().optional(),
  phone: yup.string().optional()
})

const CompanyFormModal: React.FC<CompanyFormModalProps> = ({ open, onClose }) => {
  const dispatch = useDispatch<AppDispatch>()
  
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<CompanyFormInputs>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      rif: '',
      address: '',
      phone: ''
    }
  })

  const onSubmit = async (data: CompanyFormInputs) => {
    try {
      await dispatch(createCompany(data)).unwrap()
      toast.success('Empresa registrada e importada con éxito')
      reset()
      onClose()
    } catch (error: any) {
      toast.error(error || 'Ocurrió un error al crear la empresa')
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Registrar Nueva Empresa</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Nombre / Razón Social *"
                    error={errors.name?.message}
                    placeholder="Ej. Ferretería El Tornillo, C.A."
                    {...field}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="rif"
                control={control}
                render={({ field }) => (
                  <FormField
                    label="RIF (Registro de Información Fiscal) *"
                    error={errors.rif?.message}
                    placeholder="Ej. J-12345678-9"
                    {...field}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="address"
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Dirección Física"
                    error={errors.address?.message}
                    placeholder="Av. Principal Caracas, Edo. Miranda"
                    {...field}
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <FormField
                    label="Teléfono de Contacto"
                    error={errors.phone?.message}
                    placeholder="Ej. 0212-5555555"
                    {...field}
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary" variant="outlined">
            Cancelar
          </Button>
          <Button type="submit" variant="contained" loading={isSubmitting}>
            Guardar Empresa
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}

export default CompanyFormModal
