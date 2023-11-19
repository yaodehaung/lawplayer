import { IsNotEmpty,  IsString } from 'class-validator';

import { IsUrl } from 'class-validator';

export class CreatePostDto {
  @IsUrl()
  @IsNotEmpty()
  @IsString()
  readonly coverUrl: string;
  readonly imgurCoverUrl?: string;
  readonly status?: string;
}
