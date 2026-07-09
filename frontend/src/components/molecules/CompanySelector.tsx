import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { RootState, AppDispatch } from 'src/store'
import { fetchCompanies, setActiveCompany, Company } from 'src/store/apps/company'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Icon from 'src/components/atoms/Icon'

const CompanySelector: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { companies, activeCompany, loading } = useSelector((state: RootState) => state.company)
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  
  useEffect(() => {
    if (companies.length === 0 && !loading) {
      dispatch(fetchCompanies())
    }
  }, [dispatch, companies.length, loading])

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  const handleSelect = (company: Company) => {
    dispatch(setActiveCompany(company))
    handleClose()
    window.location.reload()
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Button
        color="inherit"
        onClick={handleClick}
        sx={{ textTransform: 'none', display: 'flex', alignItems: 'center', gap: 1 }}
        startIcon={<Icon icon="mdi:office-building" />}
        endIcon={<Icon icon="mdi:chevron-down" />}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {activeCompany ? activeCompany.name : 'Seleccionar Empresa'}
        </Typography>
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
        {companies.map(company => (
          <MenuItem
            key={company.id}
            selected={activeCompany?.id === company.id}
            onClick={() => handleSelect(company)}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {company.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                RIF: {company.rif}
              </Typography>
            </Box>
          </MenuItem>
        ))}
        {companies.length === 0 && (
          <MenuItem disabled>
            <Typography variant="body2">No hay empresas disponibles</Typography>
          </MenuItem>
        )}
      </Menu>
    </Box>
  )
}

export default CompanySelector
