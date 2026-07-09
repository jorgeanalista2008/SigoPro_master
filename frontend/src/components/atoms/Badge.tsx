import React from 'react'
import Chip, { ChipProps } from '@mui/material/Chip'

export type CustomBadgeProps = ChipProps

const Badge: React.FC<CustomBadgeProps> = (props) => {
  return (
    <Chip
      size="small"
      variant="outlined"
      {...props}
    />
  )
}

export default Badge
