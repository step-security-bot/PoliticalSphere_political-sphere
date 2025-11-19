/**
 * Main application initialization and configuration
 */

export interface AppConfig {
  apiUrl: string;
  websocketUrl: string;
  environment: 'development' | 'production' | 'staging';
}

export class App {
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.config = config;
  }

  /**
   * Initialize the application
   */
  async initialize(): Promise<void> {
    console.log('Initializing Political Sphere app...', this.config.environment);

    // Initialize core services
    await this.initializeServices();

    // Setup error handling
    this.setupErrorHandling();

    // Setup performance monitoring
    this.setupPerformanceMonitoring();

    console.log('App initialized successfully');
  }

  private async initializeServices(): Promise<void> {
    // Initialize authentication
    // Initialize API client
    // Initialize WebSocket connection
    // etc.
  }

  private setupErrorHandling(): void {
    window.addEventListener('error', event => {
      console.error('Global error:', event.error);
      // Report to error tracking service
    });

    window.addEventListener('unhandledrejection', event => {
      console.error('Unhandled promise rejection:', event.reason);
      // Report to error tracking service
    });
  }

  private setupPerformanceMonitoring(): void {
    // Setup performance observers
    if ('PerformanceObserver' in window) {
      // Monitor long tasks, layout shifts, etc.
    }
  }

  /**
   * Get current app configuration
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }
}

// Default configuration
export const defaultConfig: AppConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  websocketUrl: import.meta.env.VITE_WS_URL || 'ws://localhost:3001',
  environment: (import.meta.env.MODE as AppConfig['environment']) || 'development',
};

export const app = new App(defaultConfig);
