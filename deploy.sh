#!/bin/bash

# MarkdownEditor Deployment Script
# Usage: ./deploy.sh [environment] [action]
# Example: ./deploy.sh production deploy

set -e

# Configuration
ENV=${1:-development}
ACTION=${2:-deploy}
APP_NAME="markdown-editor"
DOCKER_COMPOSE_FILE="docker-compose.yml"
DEV_COMPOSE_FILE="docker-compose.dev.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    if [ ! -f ".env" ]; then
        log_warning ".env file not found. Creating from .env.example..."
        cp .env.example .env
        log_warning "Please update the .env file with your configuration before proceeding."
    fi
    
    log_success "Prerequisites check completed"
}

# Build Docker images
build() {
    log_info "Building Docker images for $ENV environment..."
    
    if [ "$ENV" = "development" ]; then
        docker-compose -f $DOCKER_COMPOSE_FILE -f $DEV_COMPOSE_FILE build
    else
        docker-compose -f $DOCKER_COMPOSE_FILE build
    fi
    
    log_success "Docker images built successfully"
}

# Deploy the application
deploy() {
    log_info "Deploying $APP_NAME in $ENV environment..."
    
    # Create necessary directories
    mkdir -p logs database/backup
    
    # Set proper permissions
    chmod 755 logs database/backup
    
    if [ "$ENV" = "development" ]; then
        log_info "Starting development environment..."
        docker-compose -f $DOCKER_COMPOSE_FILE -f $DEV_COMPOSE_FILE up -d
        
        log_info "Development services:"
        echo "  - Application: http://localhost:3000"
        echo "  - Database Admin: http://localhost:8081 (adminer)"
        echo "  - Redis Admin: http://localhost:8082 (redis-commander)"
    else
        log_info "Starting production environment..."
        docker-compose -f $DOCKER_COMPOSE_FILE up -d
        
        log_info "Production services:"
        echo "  - Application: http://localhost:3000"
        echo "  - Traefik Dashboard: http://localhost:8080"
    fi
    
    # Wait for services to be ready
    log_info "Waiting for services to be ready..."
    sleep 10
    
    # Check service health
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        log_success "Application is healthy and ready!"
    else
        log_warning "Application health check failed. Check logs with: docker-compose logs"
    fi
    
    log_success "Deployment completed successfully"
}

# Stop the application
stop() {
    log_info "Stopping $APP_NAME..."
    
    if [ "$ENV" = "development" ]; then
        docker-compose -f $DOCKER_COMPOSE_FILE -f $DEV_COMPOSE_FILE down
    else
        docker-compose -f $DOCKER_COMPOSE_FILE down
    fi
    
    log_success "Application stopped"
}

# Restart the application
restart() {
    log_info "Restarting $APP_NAME..."
    stop
    sleep 5
    deploy
}

# Show logs
logs() {
    log_info "Showing logs for $APP_NAME..."
    
    if [ "$ENV" = "development" ]; then
        docker-compose -f $DOCKER_COMPOSE_FILE -f $DEV_COMPOSE_FILE logs -f
    else
        docker-compose -f $DOCKER_COMPOSE_FILE logs -f
    fi
}

# Clean up (remove containers, networks, volumes)
clean() {
    log_warning "This will remove all containers, networks, and volumes. Are you sure? (y/N)"
    read -r response
    
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        log_info "Cleaning up $APP_NAME..."
        
        if [ "$ENV" = "development" ]; then
            docker-compose -f $DOCKER_COMPOSE_FILE -f $DEV_COMPOSE_FILE down -v --rmi all
        else
            docker-compose -f $DOCKER_COMPOSE_FILE down -v --rmi all
        fi
        
        # Remove dangling images
        docker image prune -f
        
        log_success "Cleanup completed"
    else
        log_info "Cleanup cancelled"
    fi
}

# Backup database
backup() {
    log_info "Creating database backup..."
    
    BACKUP_FILE="database/backup/backup-$(date +%Y%m%d-%H%M%S).sql"
    
    if [ "$ENV" = "development" ]; then
        docker-compose -f $DOCKER_COMPOSE_FILE -f $DEV_COMPOSE_FILE exec -T postgres pg_dump -U markdown_user markdown_editor_dev > "$BACKUP_FILE"
    else
        docker-compose -f $DOCKER_COMPOSE_FILE exec -T postgres pg_dump -U markdown_user markdown_editor > "$BACKUP_FILE"
    fi
    
    log_success "Database backup created: $BACKUP_FILE"
}

# Show application status
status() {
    log_info "Application status:"
    
    if [ "$ENV" = "development" ]; then
        docker-compose -f $DOCKER_COMPOSE_FILE -f $DEV_COMPOSE_FILE ps
    else
        docker-compose -f $DOCKER_COMPOSE_FILE ps
    fi
}

# Show help
show_help() {
    echo "MarkdownEditor Deployment Script"
    echo ""
    echo "Usage: $0 [environment] [action]"
    echo ""
    echo "Environments:"
    echo "  development    Development environment with dev tools"
    echo "  production     Production environment"
    echo ""
    echo "Actions:"
    echo "  deploy         Build and deploy the application (default)"
    echo "  build          Build Docker images only"
    echo "  stop           Stop the application"
    echo "  restart        Restart the application"
    echo "  logs           Show application logs"
    echo "  status         Show application status"
    echo "  backup         Create database backup"
    echo "  clean          Remove all containers, networks, and volumes"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 development deploy     # Deploy in development mode"
    echo "  $0 production deploy      # Deploy in production mode"
    echo "  $0 development logs       # Show development logs"
    echo "  $0 production backup      # Create production database backup"
}

# Main script logic
case $ACTION in
    "deploy")
        check_prerequisites
        build
        deploy
        ;;
    "build")
        check_prerequisites
        build
        ;;
    "stop")
        stop
        ;;
    "restart")
        restart
        ;;
    "logs")
        logs
        ;;
    "status")
        status
        ;;
    "backup")
        backup
        ;;
    "clean")
        clean
        ;;
    "help")
        show_help
        ;;
    *)
        log_error "Unknown action: $ACTION"
        show_help
        exit 1
        ;;
esac