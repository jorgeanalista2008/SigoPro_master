import React from 'react'
import Grid from '@mui/material/Grid'
import FiscalBookTable from 'src/components/organisms/FiscalBookTable'

const ISLRWithholdingsPage = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <FiscalBookTable type="VENTA" />
      </Grid>
    </Grid>
  )
}

export default ISLRWithholdingsPage
