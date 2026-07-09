import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from 'src/configs/api'

export interface Company {
  id: string
  name: string
  rif: string
  address?: string
  phone?: string
  isActive: boolean
  tenantId?: string
}

interface CompanyState {
  companies: Company[]
  activeCompany: Company | null
  loading: boolean
  error: string | null
}

const initialState: CompanyState = {
  companies: [],
  activeCompany: null,
  loading: false,
  error: null
}

// Fetch companies
export const fetchCompanies = createAsyncThunk('company/fetchCompanies', async (_, { dispatch, rejectWithValue }) => {
  try {
    const response = await api.get<Company[]>('/companies')
    const companies = response.data
    
    // Auto-select active company from localStorage or default to the first one
    const storedCompanyId = window.localStorage.getItem('activeCompanyId')
    let active = null
    if (storedCompanyId) {
      active = companies.find(c => c.id === storedCompanyId) || null
    }
    
    if (!active && companies.length > 0) {
      active = companies[0]
      window.localStorage.setItem('activeCompanyId', active.id)
    }
    
    dispatch(setCompanies(companies))
    if (active) {
      dispatch(setActiveCompany(active))
    }
    
    return companies
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'Error al obtener las empresas')
  }
})

// Create company and automatically import default accounts
export const createCompany = createAsyncThunk(
  'company/createCompany',
  async (
    companyData: { name: string; rif: string; address?: string; phone?: string },
    { dispatch, rejectWithValue }
  ) => {
    try {
      // 1. Create company
      const response = await api.post<Company>('/companies', companyData)
      const newCompany = response.data

      // 2. Automatically import VEN-NIF plan of accounts
      try {
        await api.post(`/companies/${newCompany.id}/accounts/import-default`)
      } catch (importErr) {
        console.error('Error al importar plan de cuentas por defecto:', importErr)
      }


      // 3. Refresh list and set newly created company as active
      await dispatch(fetchCompanies())
      dispatch(setActiveCompany(newCompany))
      window.localStorage.setItem('activeCompanyId', newCompany.id)

      return newCompany
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Error al crear la empresa')
    }
  }
)

const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {
    setCompanies: (state, action: PayloadAction<Company[]>) => {
      state.companies = action.payload
    },
    setActiveCompany: (state, action: PayloadAction<Company>) => {
      state.activeCompany = action.payload
      if (action.payload) {
        window.localStorage.setItem('activeCompanyId', action.payload.id)
      } else {
        window.localStorage.removeItem('activeCompanyId')
      }
    },
    clearActiveCompany: (state) => {
      state.activeCompany = null
      window.localStorage.removeItem('activeCompanyId')
    }
  },
  extraReducers: builder => {
    builder
      .addCase(fetchCompanies.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCompanies.fulfilled, state => {
        state.loading = false
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(createCompany.pending, state => {
        state.loading = true
        state.error = null
      })
      .addCase(createCompany.fulfilled, state => {
        state.loading = false
      })
      .addCase(createCompany.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  }
})

export const { setCompanies, setActiveCompany, clearActiveCompany } = companySlice.actions
export default companySlice.reducer
