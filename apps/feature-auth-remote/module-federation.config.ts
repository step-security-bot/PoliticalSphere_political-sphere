/**
 * Module Federation Configuration - Feature Auth Remote
 *
 * This configuration file is required for webpack module federation setup.
 * Currently using default configuration - will be customized as needed.
 *
 * @see https://webpack.js.org/concepts/module-federation/
 */

export default {
  name: 'feature_auth_remote',
  filename: 'remoteEntry.js',
  exposes: {
    './AuthModule': './src/index',
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18.0.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
  },
};
