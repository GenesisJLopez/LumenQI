#!/bin/bash

# Apple Icon Generation Script for Lumen QI
# Generates all required icon sizes for iOS and macOS from source logo

set -e

LOGO_SOURCE="attached_assets/lumen-logo.svg"
ICONS_DIR="build/icons"

# Create icons directory
mkdir -p "$ICONS_DIR/ios"
mkdir -p "$ICONS_DIR/mac"

echo "🎨 Generating Apple icons from $LOGO_SOURCE..."

# Check if ImageMagick is available
if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Please install it to generate icons."
    echo "   Run: brew install imagemagick (on macOS)"
    exit 1
fi

# iOS App Icons (required sizes)
ios_sizes=(
    "20:Icon-20.png"
    "29:Icon-29.png"
    "40:Icon-40.png"
    "58:Icon-58.png"
    "60:Icon-60.png"
    "80:Icon-80.png"
    "87:Icon-87.png"
    "120:Icon-120.png"
    "180:Icon-180.png"
    "1024:Icon-1024.png"
)

echo "📱 Generating iOS icons..."
for size_name in "${ios_sizes[@]}"; do
    IFS=':' read -r size name <<< "$size_name"
    echo "  Generating ${size}x${size} -> $name"
    convert "$LOGO_SOURCE" -resize "${size}x${size}" "$ICONS_DIR/ios/$name"
done

# macOS App Icons (required sizes)
mac_sizes=(
    "16:icon_16x16.png"
    "32:icon_32x32.png"
    "64:icon_64x64.png"
    "128:icon_128x128.png"
    "256:icon_256x256.png"
    "512:icon_512x512.png"
    "1024:icon_1024x1024.png"
)

echo "🖥️ Generating macOS icons..."
for size_name in "${mac_sizes[@]}"; do
    IFS=':' read -r size name <<< "$size_name"
    echo "  Generating ${size}x${size} -> $name"
    convert "$LOGO_SOURCE" -resize "${size}x${size}" "$ICONS_DIR/mac/$name"
done

# Generate macOS .icns file
echo "🖥️ Creating macOS .icns file..."
mkdir -p "$ICONS_DIR/mac/lumen-logo.iconset"

# Copy icons to iconset
cp "$ICONS_DIR/mac/icon_16x16.png" "$ICONS_DIR/mac/lumen-logo.iconset/icon_16x16.png"
cp "$ICONS_DIR/mac/icon_32x32.png" "$ICONS_DIR/mac/lumen-logo.iconset/icon_16x16@2x.png"
cp "$ICONS_DIR/mac/icon_32x32.png" "$ICONS_DIR/mac/lumen-logo.iconset/icon_32x32.png"
cp "$ICONS_DIR/mac/icon_64x64.png" "$ICONS_DIR/mac/lumen-logo.iconset/icon_32x32@2x.png"
cp "$ICONS_DIR/mac/icon_128x128.png" "$ICONS_DIR/mac/lumen-logo.iconset/icon_128x128.png"
cp "$ICONS_DIR/mac/icon_256x256.png" "$ICONS_DIR/mac/lumen-logo.iconset/icon_128x128@2x.png"
cp "$ICONS_DIR/mac/icon_256x256.png" "$ICONS_DIR/mac/lumen-logo.iconset/icon_256x256.png"
cp "$ICONS_DIR/mac/icon_512x512.png" "$ICONS_DIR/mac/lumen-logo.iconset/icon_256x256@2x.png"
cp "$ICONS_DIR/mac/icon_512x512.png" "$ICONS_DIR/mac/lumen-logo.iconset/icon_512x512.png"
cp "$ICONS_DIR/mac/icon_1024x1024.png" "$ICONS_DIR/mac/lumen-logo.iconset/icon_512x512@2x.png"

# Convert to .icns
if command -v iconutil &> /dev/null; then
    iconutil -c icns "$ICONS_DIR/mac/lumen-logo.iconset" -o "$ICONS_DIR/mac/lumen-logo.icns"
    echo "✅ Created lumen-logo.icns"
else
    echo "⚠️ iconutil not found. .icns file not created (macOS only tool)"
fi

# Generate iOS Asset Catalog
echo "📱 Creating iOS Asset Catalog..."
mkdir -p "$ICONS_DIR/ios/AppIcon.appiconset"

cat > "$ICONS_DIR/ios/AppIcon.appiconset/Contents.json" << EOL
{
  "images" : [
    {
      "size" : "20x20",
      "idiom" : "iphone",
      "filename" : "Icon-40.png",
      "scale" : "2x"
    },
    {
      "size" : "20x20",
      "idiom" : "iphone",
      "filename" : "Icon-60.png",
      "scale" : "3x"
    },
    {
      "size" : "29x29",
      "idiom" : "iphone",
      "filename" : "Icon-58.png",
      "scale" : "2x"
    },
    {
      "size" : "29x29",
      "idiom" : "iphone",
      "filename" : "Icon-87.png",
      "scale" : "3x"
    },
    {
      "size" : "40x40",
      "idiom" : "iphone",
      "filename" : "Icon-80.png",
      "scale" : "2x"
    },
    {
      "size" : "40x40",
      "idiom" : "iphone",
      "filename" : "Icon-120.png",
      "scale" : "3x"
    },
    {
      "size" : "60x60",
      "idiom" : "iphone",
      "filename" : "Icon-120.png",
      "scale" : "2x"
    },
    {
      "size" : "60x60",
      "idiom" : "iphone",
      "filename" : "Icon-180.png",
      "scale" : "3x"
    },
    {
      "size" : "1024x1024",
      "idiom" : "ios-marketing",
      "filename" : "Icon-1024.png",
      "scale" : "1x"
    }
  ],
  "info" : {
    "version" : 1,
    "author" : "xcode"
  }
}
EOL

# Copy icons to Asset Catalog
cp "$ICONS_DIR/ios/"*.png "$ICONS_DIR/ios/AppIcon.appiconset/"

echo "✅ Apple icons generated successfully!"
echo "📁 iOS icons: $ICONS_DIR/ios/"
echo "📁 macOS icons: $ICONS_DIR/mac/"
echo ""
echo "📋 Next Steps:"
echo "1. Copy iOS AppIcon.appiconset to ios/Lumen QI/Assets.xcassets/"
echo "2. Copy macOS .icns file to assets/ directory"
echo "3. Update Xcode project to use new icons"