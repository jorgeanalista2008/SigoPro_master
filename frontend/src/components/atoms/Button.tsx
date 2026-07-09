import React from 'react'
import MuiButton, { ButtonProps } from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'

export interface CustomButtonProps extends ButtonProps {
  loading?: boolean
}

const Button: React.FC<CustomButtonProps> = ({ children, loading, disabled, ...props }) => {
  return (
    <MuiButton
      disabled={disabled || loading}
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : props.startIcon}
      {...props}
    >
      {children}
    </MuiButton>
  )
}

export default Button
