// ** React Imports
import { useEffect, useState } from 'react'

// ** API Import
import api from 'src/configs/api'

// ** Hook Import
import { useAuth } from 'src/hooks/useAuth'

// ** Type Import
import { VerticalNavItemsType } from 'src/@core/layouts/types'

const sanitizeMenu = (items: any[]): any[] => {
  if (!items || !Array.isArray(items)) return []
  
  return items.map(item => {
    const newItem = { ...item }
    if (newItem.children && Array.isArray(newItem.children) && newItem.children.length > 0) {
      newItem.children = sanitizeMenu(newItem.children)
    } else {
      delete newItem.children
    }
    
    return newItem
  })
}

const ServerSideNavItems = () => {
  // ** Hooks
  const auth = useAuth()
  
  // ** State
  const [menuItems, setMenuItems] = useState<VerticalNavItemsType>([])

  useEffect(() => {
    if (!auth.user) return

    api
      .get('/menu')
      .then(response => {
        const menuArray = response.data
        const sanitized = sanitizeMenu(menuArray)

        let finalItems: VerticalNavItemsType = []

        if (auth.user?.isSuperAdmin) {
          // Super Admin: Only show Dashboard, Subscription Management, and Personal Profile
          const panelGeneral = sanitized.find(item => item.path === '/dashboard') || {
            title: 'Panel General',
            path: '/dashboard',
            icon: 'mdi:view-dashboard-outline'
          }

          const saasAdminMenu = {
            title: 'Suscripciones',
            icon: 'mdi:shield-key-outline',
            children: [
              {
                title: 'Suscriptores',
                path: '/admin/tenants',
                icon: 'mdi:account-group-outline'
              }
            ]
          }


          const profileMenu = {
            title: 'Mi Perfil',
            path: '/configuracion/perfil',
            icon: 'mdi:account-outline'
          }

          finalItems = [panelGeneral, saasAdminMenu, profileMenu]
        } else {
          // Standard Tenant User (e.g. Admin, Contador, Auxiliar)
          const accountingMenu = {
            title: 'Contabilidad',
            icon: 'mdi:book-open-outline',
            children: [
              {
                title: 'Plan de Cuentas',
                path: '/contabilidad/cuentas',
                icon: 'mdi:file-tree-outline'
              },
              {
                title: 'Asientos de Diario',
                path: '/contabilidad/asientos',
                icon: 'mdi:book-edit-outline'
              }
            ]
          }
          finalItems = [...sanitized, accountingMenu]
        }

        setMenuItems(finalItems)
      })
      .catch(error => {
        console.error('Error fetching navigation menu:', error)
        setMenuItems([])
      })
  }, [auth.user])



  return { menuItems }
}

export default ServerSideNavItems
