export interface GitHubConfig {
  token: string;
  apiUrl: string;
  timeout: number;
  maxRetries: number;
  rateLimitBuffer: number;
}

export const githubConfig = (): { github: GitHubConfig } => ({
  github: {
    token: process.env.GITHUB_TOKEN || '',
    apiUrl: process.env.GITHUB_API_URL || 'https://api.github.com',
    timeout: parseInt(process.env.GITHUB_TIMEOUT || '5000', 10),
    maxRetries: parseInt(process.env.GITHUB_MAX_RETRIES || '3', 10),
    rateLimitBuffer: parseInt(process.env.GITHUB_RATE_LIMIT_BUFFER || '10', 10),
  },
});