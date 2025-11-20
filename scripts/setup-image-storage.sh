#!/bin/bash
# Setup Persistent Image Storage
# This script creates the upload directory OUTSIDE the project
# to prevent customer images from being deleted during builds

set -e  # Exit on error

echo "=== Crystal Keepsakes Image Storage Setup ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Detect web root
if [ -d "/var/www" ]; then
    WEB_ROOT="/var/www"
elif [ -d "/usr/share/nginx/html" ]; then
    WEB_ROOT="/usr/share/nginx/html"
else
    echo -e "${RED}Could not detect web root. Please specify manually.${NC}"
    read -p "Enter web root path: " WEB_ROOT
fi

echo "Web root: $WEB_ROOT"
echo ""

# Create persistent data directory
DATA_DIR="$WEB_ROOT/crystal-data"
UPLOAD_DIR="$DATA_DIR/order-images"
TEST_UPLOAD_DIR="$DATA_DIR/order-images-test"

echo "Creating persistent storage directories..."
echo "  - $DATA_DIR"
echo "  - $UPLOAD_DIR (production)"
echo "  - $TEST_UPLOAD_DIR (testing)"
echo ""

# Create directories
mkdir -p "$UPLOAD_DIR"
mkdir -p "$TEST_UPLOAD_DIR"

echo -e "${GREEN}✓${NC} Directories created"
echo ""

# Detect web server user
if id "www-data" &>/dev/null; then
    WEB_USER="www-data"
    WEB_GROUP="www-data"
elif id "apache" &>/dev/null; then
    WEB_USER="apache"
    WEB_GROUP="apache"
elif id "nginx" &>/dev/null; then
    WEB_USER="nginx"
    WEB_GROUP="nginx"
else
    echo -e "${YELLOW}⚠${NC} Could not detect web server user"
    read -p "Enter web server user (e.g., www-data, apache, nginx): " WEB_USER
    WEB_GROUP="$WEB_USER"
fi

echo "Setting ownership to $WEB_USER:$WEB_GROUP..."
chown -R "$WEB_USER:$WEB_GROUP" "$DATA_DIR"
echo -e "${GREEN}✓${NC} Ownership set"
echo ""

echo "Setting permissions..."
chmod 755 "$DATA_DIR"
chmod 775 "$UPLOAD_DIR"
chmod 775 "$TEST_UPLOAD_DIR"
echo -e "${GREEN}✓${NC} Permissions set"
echo ""

# Test write permissions
TEST_FILE="$UPLOAD_DIR/.test-write"
if sudo -u "$WEB_USER" touch "$TEST_FILE" 2>/dev/null; then
    rm "$TEST_FILE"
    echo -e "${GREEN}✓${NC} Write test successful"
else
    echo -e "${RED}✗${NC} Write test failed - check permissions"
    exit 1
fi
echo ""

# Check for existing images in old location
PROJECT_DIR="$(dirname "$(dirname "$(readlink -f "$0")")")"
OLD_LOCATIONS=(
    "$PROJECT_DIR/api/uploads/order-images"
    "$PROJECT_DIR/public/uploads/order-images"
    "$PROJECT_DIR/out/uploads/order-images"
)

FOUND_OLD_IMAGES=false
for OLD_DIR in "${OLD_LOCATIONS[@]}"; do
    if [ -d "$OLD_DIR" ] && [ "$(ls -A "$OLD_DIR" 2>/dev/null)" ]; then
        echo -e "${YELLOW}⚠${NC} Found existing images in: $OLD_DIR"
        FOUND_OLD_IMAGES=true
    fi
done

if [ "$FOUND_OLD_IMAGES" = true ]; then
    echo ""
    echo "Would you like to migrate existing images? (y/n)"
    read -p "> " MIGRATE
    
    if [ "$MIGRATE" = "y" ]; then
        for OLD_DIR in "${OLD_LOCATIONS[@]}"; do
            if [ -d "$OLD_DIR" ] && [ "$(ls -A "$OLD_DIR" 2>/dev/null)" ]; then
                echo "Copying from $OLD_DIR..."
                cp -r "$OLD_DIR/"* "$UPLOAD_DIR/"
                echo -e "${GREEN}✓${NC} Copied"
            fi
        done
        
        # Fix permissions on migrated files
        chown -R "$WEB_USER:$WEB_GROUP" "$UPLOAD_DIR"
        find "$UPLOAD_DIR" -type d -exec chmod 755 {} \;
        find "$UPLOAD_DIR" -type f -exec chmod 644 {} \;
        
        echo ""
        echo -e "${GREEN}✓${NC} Migration complete"
        echo ""
        echo -e "${YELLOW}NOTE:${NC} Old files are still in original location (not deleted)"
        echo "After verifying everything works, you can manually remove:"
        for OLD_DIR in "${OLD_LOCATIONS[@]}"; do
            if [ -d "$OLD_DIR" ]; then
                echo "  rm -rf $OLD_DIR"
            fi
        done
    fi
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Update your web server configuration:"
echo ""
echo "   For Apache, add to your virtualhost or .htaccess:"
echo "   ----------------------------------------"
echo "   Alias /uploads/order-images $UPLOAD_DIR"
echo "   <Directory $UPLOAD_DIR>"
echo "       Options -Indexes +FollowSymLinks"
echo "       Require all denied"
echo "       <FilesMatch \"\.(jpg|jpeg|png|gif|webp)$\">"
echo "           Require all granted"
echo "       </FilesMatch>"
echo "   </Directory>"
echo ""
echo "   For Nginx, add to your server block:"
echo "   ----------------------------------------"
echo "   location /uploads/order-images {"
echo "       alias $UPLOAD_DIR;"
echo "       autoindex off;"
echo "       location ~ \.(jpg|jpeg|png|gif|webp)$ {"
echo "           try_files \$uri =404;"
echo "       }"
echo "   }"
echo ""
echo "2. Update .env.production:"
echo "   CUSTOMER_IMAGE_PATH=$UPLOAD_DIR"
echo ""
echo "3. Update .env.production.test:"
echo "   CUSTOMER_IMAGE_PATH=$TEST_UPLOAD_DIR"
echo ""
echo "4. Restart web server:"
echo "   sudo systemctl restart apache2  # or nginx"
echo ""
echo "5. Test upload with test-upload.php script"
echo ""
echo -e "${GREEN}Done!${NC}"
