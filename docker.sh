#!/bin/bash

# --- Colors for logging ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# --- Helper Functions ---
usage() {
    echo -e "${YELLOW}Usage: $0 {up|down|build|rebuild|restart|logs|ps|shell|prune}${NC}"
    echo ""
    echo "Commands:"
    echo "  up         - Start the services in detached mode."
    echo "  down       - Stop and remove the services."
    echo "  build      - Build all images without starting containers."
    echo "  rebuild    - Rebuild images and restart services."
    echo "  restart    - Restart all services."
    echo "  logs       - View logs (use: ./docker.sh logs [service])."
    echo "  ps         - List running containers for this project."
    echo "  shell      - Open a shell inside the 'dst-backend' container."
    echo "  prune      - Stop containers and remove all unused Docker data."
    echo ""
    echo "Example:"
    echo "  ./docker.sh up"
    echo ""
    exit 1
}

# --- Check for command ---
if [ -z "$1" ]; then
    usage
fi

COMMAND=$1
shift

# --- Main Command Switch ---
case "$COMMAND" in
    up)
        echo -e "${GREEN}==> Starting services...${NC}"
        docker compose up -d "$@"
        ;;
    down)
        echo -e "${GREEN}==> Stopping and removing services...${NC}"
        docker compose down "$@"
        ;;
    build)
        echo -e "${GREEN}==> Building Docker images...${NC}"
        docker compose build "$@"
        ;;
    rebuild)
        echo -e "${GREEN}==> Rebuilding and restarting services...${NC}"
        docker compose down
        docker compose build "$@" --no-cache
        docker compose up -d
        ;;
    restart)
        echo -e "${GREEN}==> Restarting services...${NC}"
        docker compose restart "$@"
        ;;
    logs)
        echo -e "${GREEN}==> Tailing logs... (Press Ctrl+C to exit)${NC}"
        docker compose logs -f --tail=100 "$@"
        ;;
    ps)
        echo -e "${GREEN}==> Listing running containers...${NC}"
        docker compose ps "$@"
        ;;
    shell)
        echo -e "${GREEN}==> Opening shell in 'dst-backend' container...${NC}"
        docker compose exec dst-backend sh "$@"
        ;;
    prune)
        echo -e "${YELLOW} WARNING: This will stop services and remove all unused Docker data.${NC}"
        read -p "Are you sure you want to continue? [y/N] " confirm
        if [[ $confirm =~ ^[Yy](es)?$ ]]; then
            echo -e "${RED}==> Pruning system...${NC}"
            docker compose down
            docker system prune -af
        else
            echo -e "${YELLOW}Prune cancelled.${NC}"
        fi
        ;;
    *)
        usage
        ;;
esac

exit 0
