import React from 'react'
import Grid from '@mui/material/Grid'
import TaxDocumentForm from 'src/components/organisms/TaxDocumentForm'

const FacturacionPage = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <TaxDocumentForm />
      </Grid>
    </Grid>
  )
}

export default FacturacionPage
