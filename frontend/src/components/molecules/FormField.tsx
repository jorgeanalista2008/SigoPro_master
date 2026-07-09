import React from 'react'
import FormControl from '@mui/material/FormControl'
import FormLabel from '@mui/material/FormLabel'
import FormHelperText from '@mui/material/FormHelperText'
import Input, { CustomInputProps } from 'src/components/atoms/Input'

interface FormFieldProps extends Omit<CustomInputProps, 'error'> {
  label: string
  error?: string
}

const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <FormControl fullWidth error={!!error} sx={{ mb: 4 }}>
        <FormLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 500 }}>{label}</FormLabel>
        <Input ref={ref} error={!!error} {...props} />
        {error && <FormHelperText>{error}</FormHelperText>}
      </FormControl>
    )
  }
)

FormField.displayName = 'FormField'

export default FormField

