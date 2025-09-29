export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigins: string[];
  apiPrefix: string;
}

export const appConfig = (): { app: AppConfig } => ({
  app: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    apiPrefix: process.env.API_PREFIX || 'api',
  },
});