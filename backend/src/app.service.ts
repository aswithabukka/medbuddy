import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getInfo() {
    return {
      name: 'MedBuddy API',
      version: '1.0.0',
      description: 'Telemedicine consultation platform REST API',
      environment: this.configService.get('NODE_ENV'),
      documentation: '/api',
    };
  }

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get('NODE_ENV'),
    };
  }
}
