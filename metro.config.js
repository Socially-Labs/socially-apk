const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Privy's documented resolution overrides for these transitive dependencies.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform !== 'web' && moduleName === 'rpc-websockets') {
    // React Native provides WebSocket. Select the client build instead of the
    // Node server build; this package has no default/react-native export.
    const adjusted = { ...context, unstable_conditionNames: [...context.unstable_conditionNames, 'browser'] };
    return context.resolveRequest(adjusted, moduleName, platform);
  }
  if (platform !== 'web' && (moduleName === '@noble/hashes/crypto' || moduleName === '@noble/hashes/crypto.js')) {
    // Noble 1.x maps ./crypto to ./crypto.js in its browser field but only
    // exports ./crypto. Resolve that one shim by file, keeping each importer's
    // installed Noble version and its globalThis.crypto implementation.
    const adjusted = { ...context, unstable_enablePackageExports: false };
    return context.resolveRequest(adjusted, moduleName, platform);
  }
  if (platform !== 'web' && (moduleName === 'isows' || moduleName.startsWith('zustand'))) {
    const adjusted = { ...context, unstable_enablePackageExports: false };
    return context.resolveRequest(adjusted, moduleName, platform);
  }
  if (platform !== 'web' && moduleName === 'jose') {
    const adjusted = { ...context, unstable_conditionNames: ['browser'] };
    return context.resolveRequest(adjusted, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
