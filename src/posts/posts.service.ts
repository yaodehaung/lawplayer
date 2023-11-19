import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post, status } from './entities/post.entity';
import { catchError, firstValueFrom } from 'rxjs';

import { JsonDB, Config } from 'node-json-db';
import { Queue } from 'bull';
import { InjectQueue, Processor } from '@nestjs/bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Job } from 'bull';
import { HttpService } from '@nestjs/axios';

import { Process } from '@nestjs/bull';

@Processor('message-job')
@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);
  private clientId: string;
  private db: JsonDB;
  private uuid: number = 0;
  constructor(
    @InjectQueue('message-job') private queue: Queue,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {
    this.clientId = this.configService.get<string>('clientId');
    this.initdb();
  }
  private initdb = async () => {
    this.db = new JsonDB(new Config('myDataBase', true, false, '/'));
  };
  @Cron(CronExpression.EVERY_SECOND)
  async handleCron() {
    const data: any = await this.db.getObject<any>('/posts');

    const filteredObj = Object.keys(data).reduce((p, c) => {
      if (data[c].status == status.IDLE) p[c] = data[c];
      return p;
    }, {});

    this.logger.debug(JSON.stringify(filteredObj));
  }

  @Process('message-job')
  async messageQueue(job: Job<unknown>) {
    if (job != undefined) {
      job.data['status'] = status.UPLOADING;
      await this.db.delete(`/posts/${job.data['id']}`);
      await this.db.push(`/posts/${job.data['id']}`, job.data, true);
      const { data: result } = await firstValueFrom(
        this.httpService
          .post<any>(
            'https://api.imgur.com/3/image',
            {
              image: job.data['coverUrl'],
            },
            {
              headers: {
                Authorization: `Client-ID ${this.clientId}`,
              },
            },
          )
          .pipe(
            catchError(async (error: any) => {
              job.data['status'] = status.ERROR;
              await this.db.delete(`/posts/${job.data['id']}`);
              await this.db.push(`/posts/${job.data['id']}`, job.data, true);
              this.logger.error(error.response.data);
              throw 'An error happened!';
            }),
          ),
      );

      if (result.status === 200 && result.success === true) {
        job.data['status'] = status.DONE;
        job.data['imgurCoverUrl'] = result.data.link;
        await this.db.delete(`/posts/${job.data['id']}`);
        await this.db.push(`/posts/${job.data['id']}`, job.data, true);
      }
      this.logger.debug(JSON.stringify(job));
    }
  }
  public create = async (createPostDto: CreatePostDto) => {
    const data: any = await this.db.getObject<any>('/posts');
    this.uuid = Object.keys(data).length + 1;

    const object: Post = {
      id: this.uuid,
      coverUrl: createPostDto.coverUrl,
      imgurCoverUrl: '',
      status: status.IDLE,
    };

    await this.db.push(`/posts/${this.uuid}`, object, true);
    await this.queue.add('message-job', object);

    return object;
  };

  public findAll = async () => {
    const posts: [number: Post] =
      await this.db.getObject<[number: Post]>('/posts');

    return posts;
  };

  findOne(id: number) {
    return `This action returns a #${id} post`;
  }

  update(id: number, updatePostDto: UpdatePostDto) {
    return `This action updates a #${id} post`;
  }

  remove(id: number) {
    return `This action removes a #${id} post`;
  }
}
