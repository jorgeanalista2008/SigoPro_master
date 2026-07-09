import React, { useEffect, useState, useCallback } from 'react'
import { useSelector } from 'react-redux'
import { RootState } from 'src/store'
import TreeView from '@mui/lab/TreeView'
import TreeItem from '@mui/lab/TreeItem'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import TextField from '@mui/material/TextField'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import FormControlLabel from '@mui/material/FormControlLabel'
import Switch from '@mui/material/Switch'
import Grid from '@mui/material/Grid'
import toast from 'react-hot-toast'
import api from 'src/configs/api'

import Icon from 'src/components/atoms/Icon'
import Button from 'src/components/atoms/Button'
import FormField from 'src/components/molecules/FormField'
import Badge from 'src/components/atoms/Badge'

export interface AccountNode {
  id: string
  code: string
  name: string
  level: number
  isTransactional: boolean
  children: AccountNode[]
}

const AccountTree: React.FC = () => {
  const { activeCompany } = useSelector((state: RootState) => state.company)
  
  const [treeData, setTreeData] = useState<AccountNode[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<string[]>([])
  
  // Create Account Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedParent, setSelectedParent] = useState<{ id: string; code: string; name: string } | null>(null)
  const [newAccountCode, setNewAccountCode] = useState('')
  const [newAccountName, setNewAccountName] = useState('')
  const [isTransactional, setIsTransactional] = useState(true)
  const [creating, setCreating] = useState(false)

  const loadTree = useCallback(async () => {
    if (!activeCompany) return
    setLoading(true)
    try {
      const response = await api.get<AccountNode[]>(`/companies/${activeCompany.id}/accounts`, {
        params: { format: 'tree' }
      })
      setTreeData(response.data)

      // Expand level 1 by default
      const level1Ids = response.data.map(node => node.id)
      setExpanded(level1Ids)
    } catch (error) {
      console.error('Error al cargar plan de cuentas:', error)
      toast.error('Error al cargar el plan de cuentas')
    } finally {
      setLoading(false)
    }
  }, [activeCompany])

  useEffect(() => {
    loadTree()
  }, [loadTree])


  const handleToggle = (event: React.SyntheticEvent, nodeIds: string[]) => {
    setExpanded(nodeIds)
  }

  const handleOpenAddModal = (parent: AccountNode | null) => {
    if (parent) {
      setSelectedParent({ id: parent.id, code: parent.code, name: parent.name })
      setNewAccountCode(`${parent.code}.`)
    } else {
      setSelectedParent(null)
      setNewAccountCode('')
    }
    setNewAccountName('')
    setIsTransactional(true)
    setModalOpen(true)
  }

  const handleCreateAccount = async () => {
    if (!activeCompany) return
    if (!newAccountCode || !newAccountName) {
      toast.error('Código y Nombre son obligatorios')
      
return
    }

    setCreating(true)
    try {
      await api.post(`/companies/${activeCompany.id}/accounts`, {

        code: newAccountCode,
        name: newAccountName,
        isTransactional,
        parentId: selectedParent ? selectedParent.id : null
      })
      toast.success('Cuenta contable creada con éxito')
      setModalOpen(false)
      loadTree()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al crear la cuenta')
    } finally {
      setCreating(false)
    }
  }

  // Filter tree nodes based on search keyword
  const filterTree = (nodes: AccountNode[], query: string): AccountNode[] => {
    if (!query) return nodes
    
    return nodes
      .map(node => {
        const matchesThis = 
          node.name.toLowerCase().includes(query.toLowerCase()) || 
          node.code.includes(query)
          
        const filteredChildren = filterTree(node.children || [], query)
        
        if (matchesThis || filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren
          }
        }
        
        return null
      })
      .filter(node => node !== null) as AccountNode[]
  }

  const filteredTreeData = filterTree(treeData, search)

  const renderTree = (nodes: AccountNode) => {
    const label = (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1, pr: 2, width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
            {nodes.code}
          </Typography>
          <Typography variant="body2">{nodes.name}</Typography>
          {nodes.isTransactional ? (
            <Badge label="Transaccional" color="success" size="small" variant="filled" sx={{ height: 20 }} />
          ) : (
            <Badge label="Auxiliar" color="info" size="small" sx={{ height: 20 }} />
          )}
        </Box>
        
        {/* Buttons to interact */}
        {!nodes.isTransactional && (
          <IconButton
            size="small"
            color="primary"
            onClick={(e) => {
              e.stopPropagation()
              handleOpenAddModal(nodes)
            }}
          >
            <Icon icon="mdi:plus-circle-outline" fontSize="1.2rem" />
          </IconButton>
        )}
      </Box>
    )

    return (
      <TreeItem
        key={nodes.id}
        nodeId={nodes.id}
        label={label}
        ContentProps={{
          style: {
            borderRadius: '4px'
          }
        }}
      >
        {Array.isArray(nodes.children) ? nodes.children.map((node) => renderTree(node)) : null}
      </TreeItem>
    )
  }

  return (
    <Card>
      <CardHeader
        title="Plan de Cuentas"
        subheader="Estructura jerárquica de cuentas contables de la empresa"
        action={
          <Button
            variant="contained"
            startIcon={<Icon icon="mdi:plus" />}
            onClick={() => handleOpenAddModal(null)}
            disabled={!activeCompany}
          >
            Nueva Cuenta Nivel 1
          </Button>
        }
      />
      <CardContent>
        {activeCompany ? (
          <>
            <Box sx={{ mb: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Buscar por código o nombre..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <Icon icon="mdi:magnify" sx={{ mr: 2, color: 'text.secondary' }} />
                }}
              />
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress />
              </Box>
            ) : filteredTreeData.length > 0 ? (
              <TreeView
                expanded={expanded}
                onNodeToggle={handleToggle}
                defaultCollapseIcon={<Icon icon="mdi:chevron-down" />}
                defaultExpandIcon={<Icon icon="mdi:chevron-right" />}
                sx={{ minHeight: 240, flexGrow: 1, maxWidth: '100%', overflowY: 'auto' }}
              >
                {filteredTreeData.map((node) => renderTree(node))}
              </TreeView>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography color="text.secondary">No se encontraron cuentas contables.</Typography>
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Icon icon="mdi:office-building-marker-outline" fontSize="3rem" sx={{ color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Selecciona una empresa en la barra superior para ver su plan de cuentas
            </Typography>
          </Box>
        )}
      </CardContent>

      {/* Dialog for adding account */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>
          {selectedParent ? `Crear Subcuenta de: ${selectedParent.name}` : 'Crear Cuenta Nivel 1'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {selectedParent && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                Padre: <strong>{selectedParent.code}</strong> - {selectedParent.name}
              </Typography>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <FormField
                  label="Código Contable *"
                  placeholder="Ej: 1.1.01"
                  value={newAccountCode}
                  onChange={(e) => setNewAccountCode(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <FormField
                  label="Nombre de la Cuenta *"
                  placeholder="Ej: Caja Principal"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isTransactional}
                      onChange={(e) => setIsTransactional(e.target.checked)}
                      color="primary"
                    />
                  }
                  label="Permite registrar transacciones (Cuenta Transaccional)"
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                  Las cuentas transaccionales son de último nivel y reciben asientos contables. Las auxiliares sirven para agrupar saldos.
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} color="secondary" variant="outlined">
            Cancelar
          </Button>
          <Button onClick={handleCreateAccount} variant="contained" loading={creating}>
            Crear Cuenta
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}

export default AccountTree
