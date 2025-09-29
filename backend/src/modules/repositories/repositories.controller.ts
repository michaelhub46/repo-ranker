import { Controller, Get, Query, Logger, HttpException, HttpStatus, Req } from '@nestjs/common';
import type { Request } from 'express';
import { RepositoriesService } from './repositories.service';
import { SearchRepositoriesDto } from './dto/search-request.dto';

@Controller('api/repositories')
export class RepositoriesController {
  private readonly logger = new Logger(RepositoriesController.name);

  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Get('search')
  async searchRepositories(@Query() searchDto: SearchRepositoriesDto, @Req() request: Request) {
    try {
      this.logger.log(`Search request: ${JSON.stringify(searchDto)}`);
      
      // Validate search query
      if (!searchDto.q || searchDto.q.trim().length === 0) {
        throw new HttpException(
          'Search query parameter "q" is required',
          HttpStatus.BAD_REQUEST
        );
      }

      // Extract client ID from request (IP address for now)
      const clientId = request.ip || 'unknown';

      return await this.repositoriesService.searchRepositories(searchDto, clientId);
      
    } catch (error) {
      this.logger.error(`Search failed: ${error.message}`, error.stack);
      
      // Re-throw HttpExceptions as-is
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Handle unexpected errors
      throw new HttpException(
        'An error occurred while searching repositories',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('health')
  async healthCheck() {
    return await this.repositoriesService.getHealthCheck();
  }
}