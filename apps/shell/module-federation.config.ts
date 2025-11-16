/**
 * Module Federation Configuration - Shell Application
 *
 * This is the host application that loads remote modules.
 * Currently using default configuration - will be customized as needed.
 *
 * @see https://webpack.js.org/concepts/module-federation/
 */

export default {
  name: 'shell',
  remotes: {
    featureAuthRemote: 'feature_auth_remote@http://localhost:3001/remoteEntry.js',
    featureDashboardRemote: 'feature_dashboard_remote@http://localhost:3002/remoteEntry.js',
  },
  shared: {
    react: { singleton: true, requiredVersion: '^18.0.0' },
    'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
  },
};
