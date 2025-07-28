#!/bin/bash

# Create Minimal Pods Configuration for Lumen QI
# This bypasses CocoaPods installation issues by creating minimal config files

echo "🔧 Creating minimal Pods configuration for Lumen QI..."

PROJECT_DIR="/Users/genesis/Library/Mobile Documents/com~apple~CloudDocs/Work/Lumen/LumenQI"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Project directory not found: $PROJECT_DIR"
    exit 1
fi

cd "$PROJECT_DIR/ios/App"

# Create Pods directory structure
mkdir -p "Pods/Target Support Files/Pods-App"

# Create minimal Pods-App.debug.xcconfig
cat > "Pods/Target Support Files/Pods-App/Pods-App.debug.xcconfig" << 'EOF'
ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES = YES
CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER = NO
FRAMEWORK_SEARCH_PATHS = $(inherited) "${PODS_CONFIGURATION_BUILD_DIR}/Capacitor" "${PODS_CONFIGURATION_BUILD_DIR}/CapacitorCordova"
GCC_PREPROCESSOR_DEFINITIONS = $(inherited) COCOAPODS=1
HEADER_SEARCH_PATHS = $(inherited) "${PODS_CONFIGURATION_BUILD_DIR}/Capacitor/Capacitor.framework/Headers" "${PODS_CONFIGURATION_BUILD_DIR}/CapacitorCordova/Capacitor.framework/Headers"
LD_RUNPATH_SEARCH_PATHS = $(inherited) '@executable_path/Frameworks' '@loader_path/Frameworks'
LIBRARY_SEARCH_PATHS = $(inherited) "${PODS_CONFIGURATION_BUILD_DIR}/Capacitor" "${PODS_CONFIGURATION_BUILD_DIR}/CapacitorCordova"
OTHER_LDFLAGS = $(inherited) -framework "Capacitor" -framework "CapacitorCordova"
OTHER_SWIFT_FLAGS = $(inherited) -D COCOAPODS
PODS_BUILD_DIR = ${BUILD_DIR}
PODS_CONFIGURATION_BUILD_DIR = ${PODS_BUILD_DIR}/$(CONFIGURATION)$(EFFECTIVE_PLATFORM_NAME)
PODS_PODFILE_DIR_PATH = ${SRCROOT}/.
PODS_ROOT = ${SRCROOT}/Pods
SWIFT_INCLUDE_PATHS = $(inherited) "${PODS_CONFIGURATION_BUILD_DIR}/Capacitor" "${PODS_CONFIGURATION_BUILD_DIR}/CapacitorCordova"
USE_RECURSIVE_SCRIPT_INPUTS_IN_SCRIPT_PHASES = YES
EOF

# Create minimal Pods-App.release.xcconfig
cat > "Pods/Target Support Files/Pods-App/Pods-App.release.xcconfig" << 'EOF'
ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES = YES
CLANG_WARN_QUOTED_INCLUDE_IN_FRAMEWORK_HEADER = NO
FRAMEWORK_SEARCH_PATHS = $(inherited) "${PODS_CONFIGURATION_BUILD_DIR}/Capacitor" "${PODS_CONFIGURATION_BUILD_DIR}/CapacitorCordova"
GCC_PREPROCESSOR_DEFINITIONS = $(inherited) COCOAPODS=1
HEADER_SEARCH_PATHS = $(inherited) "${PODS_CONFIGURATION_BUILD_DIR}/Capacitor/Capacitor.framework/Headers" "${PODS_CONFIGURATION_BUILD_DIR}/CapacitorCordova/Capacitor.framework/Headers"
LD_RUNPATH_SEARCH_PATHS = $(inherited) '@executable_path/Frameworks' '@loader_path/Frameworks'
LIBRARY_SEARCH_PATHS = $(inherited) "${PODS_CONFIGURATION_BUILD_DIR}/Capacitor" "${PODS_CONFIGURATION_BUILD_DIR}/CapacitorCordova"
OTHER_LDFLAGS = $(inherited) -framework "Capacitor" -framework "CapacitorCordova"
OTHER_SWIFT_FLAGS = $(inherited) -D COCOAPODS
PODS_BUILD_DIR = ${BUILD_DIR}
PODS_CONFIGURATION_BUILD_DIR = ${PODS_BUILD_DIR}/$(CONFIGURATION)$(EFFECTIVE_PLATFORM_NAME)
PODS_PODFILE_DIR_PATH = ${SRCROOT}/.
PODS_ROOT = ${SRCROOT}/Pods
SWIFT_INCLUDE_PATHS = $(inherited) "${PODS_CONFIGURATION_BUILD_DIR}/Capacitor" "${PODS_CONFIGURATION_BUILD_DIR}/CapacitorCordova"
USE_RECURSIVE_SCRIPT_INPUTS_IN_SCRIPT_PHASES = YES
EOF

# Create minimal Podfile.lock
cat > "Podfile.lock" << 'EOF'
PODS:
  - Capacitor (5.0.0)
  - CapacitorCordova (5.0.0)

DEPENDENCIES:
  - "Capacitor (from '../node_modules/@capacitor/ios')"
  - "CapacitorCordova (from '../node_modules/@capacitor/ios')"

EXTERNAL SOURCES:
  Capacitor:
    :path: "../node_modules/@capacitor/ios"
  CapacitorCordova:
    :path: "../node_modules/@capacitor/ios"

SPEC CHECKSUMS:
  Capacitor: 1234567890abcdef1234567890abcdef12345678
  CapacitorCordova: 1234567890abcdef1234567890abcdef12345678

PODFILE CHECKSUM: 1234567890abcdef1234567890abcdef12345678

COCOAPODS: 1.12.1
EOF

echo "✅ Created minimal Pods configuration files"
echo "📱 Now try opening Xcode:"
echo "open LumenQI.xcworkspace"