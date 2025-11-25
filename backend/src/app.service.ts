import { Injectable } from '@nestjs/common';
import * as os from 'os';

@Injectable()
export class AppService {
  getStatus() {
    return {
      name: 'Alves Lava a Jato - Gestão',
      status: 'ok',
      uptime: process.uptime(),
      host: os.hostname(),
      timestamp: new Date(),
    };
  }
}
