import React from 'react'
import Grid from '@mui/material/Grid'
import AccountTree from 'src/components/organisms/AccountTree'

const CuentasPage = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <AccountTree />
      </Grid>
    </Grid>
  )
}

export default CuentasPage
