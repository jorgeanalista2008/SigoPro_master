import React from 'react'
import TextField, { TextFieldProps } from '@mui/material/TextField'

export type CustomInputProps = TextFieldProps

const Input = React.forwardRef<HTMLDivElement, CustomInputProps>((props, ref) => {
  return (
    <TextField
      fullWidth
      variant="outlined"
      size="small"
      inputRef={ref}
      {...props}
    />
  )
})

Input.displayName = 'Input'

export default Input

