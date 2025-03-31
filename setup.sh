#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up AI OPS Project...${NC}"

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}Error: pnpm is not installed.${NC}"
    echo -e "Please install pnpm by running: npm install -g pnpm"
    exit 1
fi

# Install dependencies
echo -e "${GREEN}Installing dependencies...${NC}"
pnpm install

# Setup environment files
echo -e "${GREEN}Setting up environment files...${NC}"

# API environment
if [ ! -f "api/.env" ]; then
    echo -e "${YELLOW}Creating api/.env file...${NC}"
    cat > api/.env << EOF
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/aiops
OPENAI_API_KEY=your_openai_api_key
NODE_ENV=development
REDIS_URL=redis://localhost:6379
RUN_MIGRATIONS=true
LOG_LEVEL=debug
EOF
    echo -e "${GREEN}Created api/.env file. Please update with your configuration.${NC}"
else
    echo -e "${GREEN}api/.env already exists. Skipping.${NC}"
fi

# UI environment
if [ ! -f "ui/.env" ]; then
    echo -e "${YELLOW}Creating ui/.env file...${NC}"
    cat > ui/.env << EOF
VITE_API_URL=http://localhost:3000/api
EOF
    echo -e "${GREEN}Created ui/.env file. Please update with your configuration.${NC}"
else
    echo -e "${GREEN}ui/.env already exists. Skipping.${NC}"
fi

# Setup database if needed
echo -e "${YELLOW}Do you want to initialize the database? (y/n)${NC}"
read -r setup_db

if [ "$setup_db" = "y" ] || [ "$setup_db" = "Y" ]; then
    echo -e "${GREEN}Running database migrations...${NC}"
    cd api && pnpm db:migrate && cd ..
    echo -e "${GREEN}Database setup complete.${NC}"
fi

echo -e "${GREEN}Setup complete! You can now run the development server with:${NC}"
echo -e "${YELLOW}pnpm dev${NC}" 