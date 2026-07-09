import React from 'react'
import IconifyIcon from 'src/@core/components/icon'
import { IconProps } from '@iconify/react'

const Icon: React.FC<IconProps> = (props) => {
  return <IconifyIcon {...props} />
}

export default Icon
