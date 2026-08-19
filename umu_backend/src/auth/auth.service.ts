import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { PrismaService } from '../prisma.service';
import { OAuthLoginDto } from './dto/oauth-login.dto';

interface ProviderProfile {
  providerUid: string;
  email?: string;
  nickname: string;
  profileImage?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  // The iOS app performs the native OAuth flow (Google/Kakao/Naver SDK) and
  // sends us the provider's access token. We verify it directly with the
  // provider and only then issue our own JWT.
  async loginWithOAuth(dto: OAuthLoginDto) {
    const profile = await this.fetchProviderProfile(dto.provider, dto.accessToken);

    const account = await this.prisma.oAuthAccount.upsert({
      where: {
        provider_providerUid: {
          provider: dto.provider,
          providerUid: profile.providerUid,
        },
      },
      update: {},
      create: {
        provider: dto.provider,
        providerUid: profile.providerUid,
        user: {
          create: {
            email: profile.email,
            nickname: profile.nickname,
            profileImage: profile.profileImage,
          },
        },
      },
      include: { user: true },
    });

    const token = this.jwt.sign({ sub: account.user.id });
    return { accessToken: token, user: account.user };
  }

  private async fetchProviderProfile(
    provider: OAuthLoginDto['provider'],
    accessToken: string,
  ): Promise<ProviderProfile> {
    try {
      if (provider === 'GOOGLE') {
        const { data } = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return {
          providerUid: data.sub,
          email: data.email,
          nickname: data.name ?? '사용자',
          profileImage: data.picture,
        };
      }

      if (provider === 'KAKAO') {
        const { data } = await axios.get('https://kapi.kakao.com/v2/user/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return {
          providerUid: String(data.id),
          email: data.kakao_account?.email,
          nickname: data.kakao_account?.profile?.nickname ?? '사용자',
          profileImage: data.kakao_account?.profile?.profile_image_url,
        };
      }

      // NAVER
      const { data } = await axios.get('https://openapi.naver.com/v1/nid/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      return {
        providerUid: data.response.id,
        email: data.response.email,
        nickname: data.response.nickname ?? data.response.name ?? '사용자',
        profileImage: data.response.profile_image,
      };
    } catch (err) {
      throw new UnauthorizedException('OAuth token verification failed');
    }
  }
}
