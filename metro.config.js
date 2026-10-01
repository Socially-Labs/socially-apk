const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Privy's documented resolution overrides for these transitive dependencies.
config.resolver.resolveRequest = (context, moduleName, platform) => {
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
