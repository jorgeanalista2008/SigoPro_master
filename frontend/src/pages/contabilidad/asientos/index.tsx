import React from 'react'
import Grid from '@mui/material/Grid'
import JournalEntryForm from 'src/components/organisms/JournalEntryForm'

const AsientosPage = () => {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <JournalEntryForm />
      </Grid>
    </Grid>
  )
}

export default AsientosPage
