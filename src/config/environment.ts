export type Environment = 'development' | 'production' | 'staging';

export interface EnvironmentConfig {
  env: Environment;
  isDevelopment: boolean;
  isProduction: boolean;
  isStaging: boolean;
  supabase: {
    url: string;
    anonKey: string;
  };
  api: {
    timeout: number;
    retryAttempts: number;
  };
  features: {
    debugMode: boolean;
    showPerformanceMetrics: boolean;
    enableAnalytics: boolean;
    verboseLogging: boolean;
  };
  ui: {
    animationDuration: number;
    toastDuration: number;
  };
}

const getEnvironment = (): Environment => {
  const mode = import.meta.env.MODE;
  
  if (mode === 'production') return 'production';
  if (mode === 'staging') return 'staging';
  return 'development';
};

const env = getEnvironment();

export const environmentConfig: EnvironmentConfig = {
  env,
  isDevelopment: env === 'development',
  isProduction: env === 'production',
  isStaging: env === 'staging',
  
  supabase: {
    url: 'https://citibygettyzjgaewfca.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpdGlieWdldHR5empnYWV3ZmNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4NjQ3OTUsImV4cCI6MjA2ODQ0MDc5NX0.__NwcDz6CfyRZ0PViXcugbH3FBaffiwcZJb6pbjPeqw',
  },
  
  api: {
    timeout: env === 'production' ? 30000 : 60000,
    retryAttempts: env === 'production' ? 3 : 1,
  },
  
  features: {
    debugMode: env === 'development',
    showPerformanceMetrics: env === 'development',
    enableAnalytics: env === 'production',
    verboseLogging: env === 'development',
  },
  
  ui: {
    animationDuration: env === 'production' ? 200 : 300,
    toastDuration: env === 'production' ? 3000 : 5000,
  },
};

// Helper functions
export const isProduction = () => environmentConfig.isProduction;
export const isDevelopment = () => environmentConfig.isDevelopment;
export const isStaging = () => environmentConfig.isStaging;

// Log environment info in development
if (environmentConfig.isDevelopment) {
  console.log('🔧 Environment:', environmentConfig.env);
  console.log('⚙️ Config:', environmentConfig);
}
