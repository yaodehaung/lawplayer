import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { BullModule } from '@nestjs/bull';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
    BullModule.registerQueue({
      name: 'message-job',
    }),
    HttpModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}
