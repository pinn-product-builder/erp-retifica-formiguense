import { environmentConfig, type EnvironmentConfig } from '@/config/environment';

export function useEnvironment(): EnvironmentConfig {
  return environmentConfig;
}

export function useFeatureFlag(flag: keyof EnvironmentConfig['features']): boolean {
  return environmentConfig.features[flag];
}
