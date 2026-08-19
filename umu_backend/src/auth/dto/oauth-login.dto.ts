import { IsIn, IsString } from 'class-validator';

export class OAuthLoginDto {
  @IsIn(['GOOGLE', 'KAKAO', 'NAVER'])
  provider: 'GOOGLE' | 'KAKAO' | 'NAVER';

  // Access token issued by the provider's SDK on the iOS client
  @IsString()
  accessToken: string;
}
