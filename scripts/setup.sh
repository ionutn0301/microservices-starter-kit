#!/bin/bash

# Microservices Starter Kit Setup Script
echo "🚀 Setting up Microservices Starter Kit..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker and try again."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_status "All prerequisites are installed ✅"

# Install dependencies
print_status "Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    print_error "Failed to install dependencies"
    exit 1
fi

# Copy environment files
print_status "Setting up environment files..."

services=("gateway" "auth-service" "user-service" "product-service" "payment-service")

for service in "${services[@]}"; do
    env_example="apps/$service/.env.example"
    env_file="apps/$service/.env"
    
    if [ -f "$env_example" ]; then
        if [ ! -f "$env_file" ]; then
            cp "$env_example" "$env_file"
            print_status "Created $env_file"
        else
            print_warning "$env_file already exists, skipping..."
        fi
    fi
done

# Start infrastructure services
print_status "Starting infrastructure services (PostgreSQL, Redis, RabbitMQ)..."
cd infra
docker-compose up -d

if [ $? -ne 0 ]; then
    print_error "Failed to start infrastructure services"
    exit 1
fi

cd ..

# Wait for services to be ready
print_status "Waiting for services to be ready..."
sleep 10

# Generate Prisma clients
print_status "Generating Prisma clients..."
npm run prisma:generate

if [ $? -ne 0 ]; then
    print_error "Failed to generate Prisma clients"
    exit 1
fi

# Run database migrations
print_status "Running database migrations..."
npm run prisma:migrate

if [ $? -ne 0 ]; then
    print_error "Failed to run database migrations"
    exit 1
fi

print_status "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Start all services: npm run dev"
echo "2. Or start individual service: npx turbo run dev --filter=auth-service"
echo "3. View API documentation:"
echo "   - Gateway: http://localhost:3000/api/docs"
echo "   - Auth Service: http://localhost:3001/api/docs"
echo "   - User Service: http://localhost:3002/api/docs"
echo "   - Product Service: http://localhost:3003/api/docs"
echo "   - Payment Service: http://localhost:3004/api/docs"
echo ""
echo "Infrastructure:"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
echo "   - RabbitMQ Management: http://localhost:15672 (microservices/microservices123)"
echo "   - Adminer: http://localhost:8080"
echo ""
echo "Happy coding! 🚀" 