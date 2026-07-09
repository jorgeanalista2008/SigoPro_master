#!/bin/bash

# ==============================================================================
# SCRIPT DE CONFIGURACIÓN DE VPS - UBUNTU 24.04 LTS
# ==============================================================================
# Este script automatiza la instalación de:
# 1. Actualizaciones de seguridad del sistema
# 2. Herramientas básicas de compilación (build-essential, git, curl)
# 3. Node.js (mediante NVM) y PM2 (gestor de procesos)
# 4. PostgreSQL 16 y configuración de la Base de Datos contabilidad_db
# 5. Servidor Nginx para reverse proxy
# ==============================================================================

# Colores para salida en consola
GREEN='\033[0;32'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== 1. Actualizando paquetes del sistema... ===${NC}"
apt update && apt upgrade -y

echo -e "${BLUE}=== 2. Instalando dependencias básicas... ===${NC}"
apt install -y build-essential curl git software-properties-common ufw

echo -e "${BLUE}=== 3. Instalando y configurando PostgreSQL 16... ===${NC}"
apt install -y postgresql postgresql-contrib

# Iniciar y habilitar servicio
systemctl start postgresql
systemctl enable postgresql

# Configurar contraseña de postgres y crear base de datos contabilidad_db
echo -e "${BLUE}=== Configurando base de datos... ===${NC}"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'Jf18759339';"
sudo -u postgres psql -c "CREATE DATABASE contabilidad_db;"

echo -e "${BLUE}=== 4. Instalando Node Version Manager (NVM) y Node.js v20... ===${NC}"
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Cargar NVM en la sesión actual de bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

nvm install 20
nvm use 20
nvm alias default 20

echo -e "${BLUE}=== Versión de Node instalada: $(node -v) ===${NC}"
echo -e "${BLUE}=== Versión de NPM instalada: $(npm -v) ===${NC}"

echo -e "${BLUE}=== 5. Instalando PM2 (Process Manager) globalmente... ===${NC}"
npm install -g pm2

echo -e "${BLUE}=== 6. Instalando Nginx... ===${NC}"
apt install -y nginx
systemctl start nginx
systemctl enable nginx

echo -e "${BLUE}=== 7. Configurando el Firewall (UFW)... ===${NC}"
# Permitir SSH, HTTP y HTTPS
ufw allow OpenSSH
ufw allow 'Nginx Full'
# Activar firewall sin confirmación interactiva
echo "y" | ufw enable

echo -e "${BLUE}===============================================================${NC}"
echo -e "${GREEN}¡CONFIGURACIÓN BÁSICA DEL VPS COMPLETADA CON ÉXITO!${NC}"
echo -e "${BLUE}===============================================================${NC}"
echo -e "Detalles de la configuración:"
echo -e " - PostgreSQL: Base de datos 'contabilidad_db' creada."
echo -e " - Usuario DB: 'postgres' con contraseña 'Jf18759339'"
echo -e " - Node.js: v20 activa."
echo -e " - PM2 y Nginx listos."
echo -e "==============================================================="
