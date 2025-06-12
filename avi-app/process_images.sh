#!/bin/bash

# Install ImageMagick if not present
if ! command -v convert &> /dev/null; then
    apt-get update && apt-get install -y imagemagick
fi

# Create assets directory if it doesn't exist
mkdir -p assets

# Process icon.png (1024x1024)
convert source_image.png -resize 1024x1024 -background none -gravity center -extent 1024x1024 assets/icon.png

# Process adaptive-icon.png (1024x1024 with safe area)
convert source_image.png -resize 632x632 -background none -gravity center -extent 1024x1024 assets/adaptive-icon.png

# Process favicon.png (196x196)
convert source_image.png -resize 196x196 -background none -gravity center -extent 196x196 assets/favicon.png

# Process splash-icon.png (1242x2436)
convert source_image.png -resize 800x800 -background white -gravity center -extent 1242x2436 assets/splash-icon.png
