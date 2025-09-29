import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { GitHubService } from './github.service';
import { GitHubAuthService } from './github-auth.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ConfigModule,
  ],
  providers: [GitHubService, GitHubAuthService],
  exports: [GitHubService, GitHubAuthService],
})
export class GitHubModule {}