import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import Autocomplete from '@mui/material/Autocomplete'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import api from 'src/configs/api'

export interface Account {
  id: string
  code: string
  name: string
  level: number
  isTransactional: boolean
}

interface AccountSelectProps {
  value: Account | null
  onChange: (account: Account | null) => void
  error?: boolean
  helperText?: string
  label?: string
}

const AccountSelect: React.FC<AccountSelectProps> = ({ value, onChange, error, helperText, label = 'Seleccionar Cuenta' }) => {
  const { activeCompany } = useSelector((state: RootState) => state.company)
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let active = true

    if (!open || !activeCompany) {
      return undefined
    }

    setLoading(true)
    api
      .get<Account[]>(`/companies/${activeCompany.id}/accounts`, { params: { format: 'list' } })
      .then(response => {
        if (active) {
          const transactionalAccounts = response.data.filter(acc => acc.isTransactional)

          setOptions(transactionalAccounts)
        }
      })
      .catch(error => {
        console.error('Error fetching accounts for select:', error)
      })
      .finally(() => {
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [open, activeCompany])

  useEffect(() => {
    if (!open) {
      setOptions([])
    }
  }, [open])

  return (
    <Autocomplete
      id="account-select"
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      getOptionLabel={(option) => `[${option.code}] ${option.name}`}
      options={options}
      loading={loading}
      value={value}
      onChange={(_, newValue) => onChange(newValue)}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          size="small"
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  )
}

export default AccountSelect
