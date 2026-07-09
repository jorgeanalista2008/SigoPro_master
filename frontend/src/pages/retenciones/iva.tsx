import React from 'react'
import Grid from '@mui/material/Grid'
import FiscalBookTable from 'src/components/organisms/FiscalBookTable'

const IVAWithholdingsPage = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <FiscalBookTable type="COMPRA" />
      </Grid>
    </Grid>
  )
}

export default IVAWithholdingsPage
