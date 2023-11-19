export enum status {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  DONE = 'DONE',
  ERROR = 'ERROR'
}

export class Post {
  id: number;
  coverUrl: string;
  imgurCoverUrl: string;
  status: string;
}
