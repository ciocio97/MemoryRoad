import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { PatchPinDto } from './dto/patchPin.dto';
import { PatchRouteDto } from './dto/patchRoute.dto';
import { PostRouteDto } from './dto/postRoute.dto';
import { PinEntity } from './entities/pin.entity';
import { RouteEntity } from './entities/route.entity';
import {
  isClosewithOther,
  isClosewithDB,
  redefineTooClose,
} from './routes.functions';

@Injectable()
export class RoutesService {
  //routes 레포지토리 주입
  constructor(
    @InjectRepository(RouteEntity)
    private routesRepository: Repository<RouteEntity>,
    @InjectRepository(PinEntity)
    private pinsRepository: Repository<PinEntity>,
  ) {}

  async getUserRoutes(page: number): Promise<object> {
    //TODO where문으로 해당 유저의 루트만 가져오기
    //루트의 createdAt, 핀의 ranking컬럼, 사진의 아이디 순으로 오름차순 정렬
    const routes = await this.routesRepository
      .createQueryBuilder('Routes') //alias -> SELECT Routes as Routes
      .leftJoinAndSelect('Routes.Pins', 'Pins')
      .leftJoinAndSelect('Pins.Pictures', 'Pictures')
      .select([
        'Routes.id',
        'Routes.userId',
        'Routes.routeName',
        'Routes.description',
        'Routes.createdAt',
        'Routes.updatedAt',
        'Routes.public',
        'Routes.color',
        'Routes.time',
        'Pins.id',
        'Pins.ranking',
        'Pins.locationName',
        'Pictures.fileName',
      ])
      .orderBy('Routes.createdAt')
      .addOrderBy('Pins.ranking')
      .addOrderBy('Pictures.id')
      .getMany(); //여러 개의 결과를 가져온다. entity를 반환한다. getRawMany등으로 raw data를 가져올 수 있다.

    //count는 총 루트의 개수
    //페이지네이션을 위해 8개씩 나누어 보낸다
    const response = {
      code: 200,
      routes: routes.slice(page * 8 - 8, page * 8),
      count: routes.length,
    };

    response.routes.forEach((route) => {
      let fileName = null;
      //핀들의 사진을 조회해서 가장 처음 사진을 대표 사진으로 한다.
      for (let i = 0; i < route.Pins.length; i++) {
        if (!route.Pins[i].Pictures.length) continue;
        if (route.Pins[i].Pictures.length !== 0) {
          fileName = route.Pins[i].Pictures[0].fileName;
          break;
        }
      }

      route['thumbnail'] = fileName;
    });
    return response;
  }

  async createRoute(routePins: PostRouteDto): Promise<RouteEntity> {
    //public은 예약어이다
    const { routeName, description, color, time } = routePins;
    let { pins } = routePins;
    const newRoute = await this.routesRepository.save({
      userId: 1,
      routeName: routeName,
      description: description,
      public: routePins.public,
      color: color,
      time: time,
    });

    //주어진 핀들간의 거리를 계산해 tooClose프로퍼티를 추가한다.
    //tooClose프로퍼티가 추가되지 않는 경우, 디폴트 값인 '0'이 추가된다.
    isClosewithOther(pins);

    //db에 저장된 핀들과 저장하려는 핀들을 비교하기 위해 핀들의 위도, 경도를 불러온다. 개선 필요
    const dbPins = await this.pinsRepository
      .createQueryBuilder('Pins')
      .select(['Pins.id', 'Pins.latitude', 'Pins.longitude', 'Pins.tooClose'])
      .getMany();

    //인접한 점이 생긴 경우 DB에도 업데이트 해줘야 한다
    //추가하려는 점과 인점한 DB의 핀들. 이 핀들의 tooClose를 true로 업데이트 한다.
    let dbPinId: { id: number; tooClose: boolean }[] = [];

    pins.forEach((pin) => {
      dbPinId = Object.assign(dbPinId, isClosewithDB(dbPins, pin));
    });

    //DB핀들 업데이트 dbPinId가 빈 배열일 경우 실행되지 않는다.
    await this.pinsRepository.save(dbPinId);

    //pin각각에 routeId를 추가해 준다.
    pins = pins.map((pin) => {
      return Object.assign({ routesId: newRoute.id }, pin);
    });

    //새 핀들 생성
    //bulk insert
    await this.pinsRepository.save(pins);

    return newRoute;
  }

  async updateRoute(
    routeId: number,
    route: PatchRouteDto,
  ): Promise<UpdateResult> {
    //루트 아이디와 일치하는 요소 업데이트
    const result = await this.routesRepository
      .createQueryBuilder()
      .update('Routes')
      .set(route)
      .where('id = :id', { id: routeId })
      .execute();

    return result;
  }

  async deleteRoute(routeId: number) {
    const result = await this.routesRepository
      .createQueryBuilder()
      .delete()
      .from('Routes')
      .where('id = :id', { id: routeId })
      .execute();

    return result;
  }

  async getPins(routeId: number): Promise<PinEntity[]> {
    //TODO루트가 해당 사용자 소유인지 확인하기

    const pins = await this.pinsRepository
      .createQueryBuilder('Pins') //alias -> SELECT Pins as Pins
      .leftJoinAndSelect('Pins.Pictures', 'Pictures')
      .where('Pins.routesId = :id', { id: routeId })
      .orderBy('Pins.ranking')
      .addOrderBy('Pictures.id')
      .getMany(); //여러 개의 결과를 가져온다. entity를 반환한다. getRawMany등으로 raw data를 가져올 수 있다.

    return pins;
  }

  async updatePin(
    routeId: number,
    pinId: number,
    pin: PatchPinDto,
  ): Promise<UpdateResult> {
    //TODO 사진의 정보들이 들어올 경우, set 부분을 변경해야 한다.
    const result = await this.pinsRepository
      .createQueryBuilder()
      .update('Pins')
      .set(pin)
      .where('routesId = :routesId AND id = :id', {
        routesId: routeId,
        id: pinId,
      })
      .execute();

    //tooClose 갱신을 위해 모든 핀들과의 관계를 재정의 한다.
    //효율적으로 하기 위해 join table을 만들거나 자기참조 관계를 만드는 방법, 지도를 100m*100m 단위로 범주화하는 방법을 생각해 봄
    //전자는 join table을 갱신하기 위해 모든 핀들 간의 관계를 확인해야 되서 의미가 없다.
    //후자는 서울을 100m^2단위로 쪼개야 되서 구현이 힘들다고 판단했다.
    const dbPins = await this.pinsRepository
      .createQueryBuilder('Pins')
      .select(['Pins.id', 'Pins.latitude', 'Pins.longitude', 'Pins.tooClose'])
      .getMany();

    //인접한 점이 생긴 경우 DB에도 업데이트 해줘야 한다
    //추가하려는 점과 인점한 DB의 핀들. 이 핀들의 tooClose를 true로 업데이트 한다.
    const updatePinInfoId = redefineTooClose(dbPins);

    //작동방식
    //1. select문으로 updatePinInfoId의 핀들을 조회한다
    //2. 변경 사항이 있는 레코드에만 update쿼리가 실행된다.(변경 사항이 없으면 update쿼리는 실행되지 않는다.)
    await this.pinsRepository.save(updatePinInfoId);
    return result;
  }

  async deletePin(routeId: number, pinId: number) {
    const result = await this.pinsRepository
      .createQueryBuilder()
      .delete()
      .from('Pins')
      .where('routesId = :routesId AND id = :id', {
        routesId: routeId,
        id: pinId,
      })
      .execute();

    return result;
  }

  async createPin(routeId: number, pin: PatchPinDto) {
    const newPin = { ...pin, routesId: routeId };

    const dbPins = await this.pinsRepository
      .createQueryBuilder('Pins')
      .select(['Pins.id', 'Pins.latitude', 'Pins.longitude', 'Pins.tooClose'])
      .getMany();

    //추가하려는 점과 인점한 DB의 핀들. 이 핀들의 tooClose를 true로 업데이트 한다.
    let dbPinId: { id: number; tooClose: boolean }[] = [];

    //isClosewithDB 함수는 newPin의 속성을 변경할 수 있다.(순수함수가 아니다.)
    dbPinId = Object.assign(dbPinId, isClosewithDB(dbPins, newPin));

    //DB핀들 업데이트 dbPinId가 빈 배열일 경우 실행되지 않는다.
    await this.pinsRepository.save(dbPinId);

    return await this.pinsRepository.save(newPin);
  }
}
