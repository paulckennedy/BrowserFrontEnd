#!/bin/bash

# Docker deployment script for the Markdown Editor
echo "=== Markdown Editor Docker Deployment ==="

# Configuration
CONTAINER_NAME="markdown-editor-app"
IMAGE_NAME="markdown-editor:latest"
PORT="3000"

# Function to stop existing container
stop_container() {
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        echo "Stopping existing container..."
        docker stop $CONTAINER_NAME
        docker rm $CONTAINER_NAME
    fi
}

# Function to build the image
build_image() {
    echo "Building Docker image..."
    docker build -f Dockerfile.frontend -t $IMAGE_NAME .
}

# Function to run the container
run_container() {
    echo "Starting container on port $PORT..."
    docker run -d \
        --name $CONTAINER_NAME \
        -p $PORT:80 \
        --restart unless-stopped \
        -v ./logs:/var/log/nginx \
        $IMAGE_NAME
}

# Function to check status
check_status() {
    echo "Checking container status..."
    sleep 3
    if docker ps | grep -q $CONTAINER_NAME; then
        echo "✅ Container is running successfully!"
        echo "🌐 Application available at: http://localhost:$PORT"
        echo "🏥 Health check: http://localhost:$PORT/health"
        
        # Test health endpoint
        echo "Testing health endpoint..."
        if curl -f -s http://localhost:$PORT/health > /dev/null; then
            echo "✅ Health check passed!"
        else
            echo "⚠️  Health check failed"
        fi
    else
        echo "❌ Container failed to start"
        echo "Checking logs..."
        docker logs $CONTAINER_NAME
        return 1
    fi
}

# Main deployment process
main() {
    echo "Starting deployment process..."
    
    stop_container
    build_image
    
    if [ $? -eq 0 ]; then
        run_container
        check_status
    else
        echo "❌ Build failed"
        exit 1
    fi
    
    echo "=== Deployment Complete ==="
}

# Handle command line arguments
case "$1" in
    "stop")
        stop_container
        echo "Container stopped"
        ;;
    "logs")
        docker logs -f $CONTAINER_NAME
        ;;
    "status")
        docker ps | grep $CONTAINER_NAME || echo "Container not running"
        ;;
    "restart")
        stop_container
        run_container
        check_status
        ;;
    *)
        main
        ;;
esac