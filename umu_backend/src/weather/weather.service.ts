import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

interface GridCoord {
  nx: number;
  ny: number;
}

@Injectable()
export class WeatherService {
  constructor(private config: ConfigService) {}

  // Converts WGS84 lat/lon into the KMA (기상청) Lambert-Conformal grid
  // coordinates required by the 단기예보 API.
  latLonToGrid(lat: number, lon: number): GridCoord {
    const RE = 6371.00877;
    const GRID = 5.0;
    const SLAT1 = 30.0;
    const SLAT2 = 60.0;
    const OLON = 126.0;
    const OLAT = 38.0;
    const XO = 43;
    const YO = 136;

    const DEGRAD = Math.PI / 180.0;
    const re = RE / GRID;
    const slat1 = SLAT1 * DEGRAD;
    const slat2 = SLAT2 * DEGRAD;
    const olon = OLON * DEGRAD;
    const olat = OLAT * DEGRAD;

    let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
    let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = (re * sf) / Math.pow(ro, sn);

    const ra0 = Math.tan(Math.PI * 0.25 + (lat * DEGRAD) * 0.5);
    const ra = (re * sf) / Math.pow(ra0, sn);
    let theta = lon * DEGRAD - olon;
    if (theta > Math.PI) theta -= 2.0 * Math.PI;
    if (theta < -Math.PI) theta += 2.0 * Math.PI;
    theta *= sn;

    const x = Math.floor(ra * Math.sin(theta) + XO + 0.5);
    const y = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);
    return { nx: x, ny: y };
  }

  // Fetches the latest ultra-short-term forecast (초단기예보) for a grid cell.
  // Requires KMA_API_KEY (공공데이터포털 발급 서비스키) in env.
  async fetchForecast(lat: number, lon: number) {
    const { nx, ny } = this.latLonToGrid(lat, lon);
    const serviceKey = this.config.get<string>('KMA_API_KEY');

    const now = new Date();
    const baseDate = this.formatDate(now);
    const baseTime = this.nearestUltraShortBaseTime(now);

    const { data } = await axios.get(
      'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst',
      {
        params: {
          serviceKey,
          numOfRows: 100,
          pageNo: 1,
          dataType: 'JSON',
          base_date: baseDate,
          base_time: baseTime,
          nx,
          ny,
        },
      },
    );

    const items: Array<{ category: string; obsrValue: string }> =
      data?.response?.body?.items?.item ?? [];

    const get = (category: string) => items.find((i) => i.category === category)?.obsrValue;

    return {
      temperature: get('T1H'), // 기온
      precipitationType: get('PTY'), // 강수형태: 0 없음,1 비,2 비/눈,3 눈,4 소나기
      humidity: get('REH'),
      skyCondition: get('SKY'), // 참고: 초단기실황엔 없고 단기예보에서 제공, 필요시 getVilageFcst 사용
    };
  }

  // Simple rule-based mapping from weather to indoor/outdoor activity ideas.
  // pm10Grade: 1 좋음, 2 보통, 3 나쁨, 4 매우나쁨 (에어코리아 API 연동 시)
  recommendActivities(params: { precipitationType?: string; pm10Grade?: number }) {
    const isRaining = params.precipitationType && params.precipitationType !== '0';
    const isBadAir = (params.pm10Grade ?? 1) >= 3;

    if (isRaining) {
      return {
        reason: '비가 오고 있어요',
        activities: ['영화관', '실내 카페 투어', '방탈출', '보드게임 카페', '전시회 관람'],
      };
    }
    if (isBadAir) {
      return {
        reason: '미세먼지가 나쁨 수준이에요',
        activities: ['실내 클라이밍', '쇼핑몰 나들이', '공방 체험(원데이클래스)', '북카페'],
      };
    }
    return {
      reason: '날씨가 맑아요',
      activities: ['한강 피크닉', '자전거 라이딩', '동네 산책', '루프탑 카페', '테니스/러닝'],
    };
  }

  private formatDate(d: Date) {
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  }

  // Ultra-short-term observation (getUltraSrtNcst) is published every hour
  // at :40, covering the hour that just started.
  private nearestUltraShortBaseTime(d: Date) {
    const adjusted = new Date(d);
    if (d.getMinutes() < 40) adjusted.setHours(d.getHours() - 1);
    return `${String(adjusted.getHours()).padStart(2, '0')}00`;
  }
}
