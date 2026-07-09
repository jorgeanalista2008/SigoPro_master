import React, { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import Link from 'next/link'
import Box from '@mui/material/Box'
import FormControlLabel from '@mui/material/FormControlLabel'
import Checkbox from '@mui/material/Checkbox'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import Typography from '@mui/material/Typography'
import { styled } from '@mui/material/styles'

import Button from 'src/components/atoms/Button'
import Icon from 'src/components/atoms/Icon'
import FormField from 'src/components/molecules/FormField'
import { useAuth } from 'src/hooks/useAuth'

const LinkStyled = styled(Link)(({ theme }) => ({
  fontSize: '0.875rem',
  textDecoration: 'none',
  color: theme.palette.primary.main
}))

const schema = yup.object().shape({
  email: yup.string().email('Debe ser un correo electrónico válido').required('El correo electrónico es requerido'),
  password: yup.string().min(6, 'Mínimo 6 caracteres').required('La contraseña es requerida')
})

interface LoginFormProps {
  onLoginError: (errorMsg: string) => void
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginError }) => {
  const auth = useAuth()
  const [rememberMe, setRememberMe] = useState<boolean>(true)
  const [showPassword, setShowPassword] = useState<boolean>(false)

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      email: '',
      password: ''
    },
    mode: 'onBlur',
    resolver: yupResolver(schema)
  })

  const onSubmit = async (data: any) => {
    try {
      await auth.login({ email: data.email, password: data.password, rememberMe }, (err: any) => {
        console.error('Login error callback:', err)
        onLoginError('Correo electrónico o contraseña incorrectos')
      })
    } catch (err: any) {
      onLoginError('Error de red o del servidor al iniciar sesión')
    }
  }

  return (
    <form noValidate autoComplete="off" onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="email"
        control={control}
        render={({ field }) => (
          <FormField
            label="Correo Electrónico *"
            placeholder="ejemplo@demo.com"
            error={errors.email?.message}
            {...field}
          />
        )}
      />

      <Box sx={{ mb: 4, position: 'relative' }}>
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <FormField
              label="Contraseña *"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••"
              error={errors.password?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      edge="end"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <Icon icon={showPassword ? 'mdi:eye-outline' : 'mdi:eye-off-outline'} fontSize={20} />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              {...field}
            />
          )}
        />
      </Box>

      <Box
        sx={{
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'space-between'
        }}
      >
        <FormControlLabel
          label="Recordarme"
          control={
            <Checkbox
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              color="primary"
            />
          }
        />
        <LinkStyled href="/forgot-password">¿Olvidó su contraseña?</LinkStyled>
      </Box>

      <Button
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        sx={{ mb: 7 }}
      >
        Iniciar Sesión
      </Button>

      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Typography variant="body2" sx={{ mr: 2 }}>
          ¿Nuevo en nuestra plataforma?
        </Typography>
        <Typography variant="body2">
          <LinkStyled href="/register">Crear una cuenta</LinkStyled>
        </Typography>
      </Box>
    </form>
  )
}

export default LoginForm
