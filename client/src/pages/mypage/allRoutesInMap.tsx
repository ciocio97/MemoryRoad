import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../redux/reducer';
import ColorSelectBox from '../../components/colorSelectBox/colorSelectBoxForMap';
import './allRoutesInMap.css';
import axios from 'axios';
import { Route } from '../../types/searchRoutesTypes';
import { InfoWindowContent } from '../../modals/pinContent/pinContent'; // infoWindow 창 생성하는 함수
import fakeData from './fakeData.json';

// 루트를 받고, 루트의 핀 값을 받을 것 같음
// 각 루트별로 핀 객체를 받고, 받은 핀 객체값을 For문, 혹은 ForEach를 통해 핀의 위치값을 받아서 핀을 그리고 선을 이어줘야 할 것 같음
// 그렇게 다 뿌리고 나면, 각 핀을 클릭했을 경우에 이벤트가 발생해서 핀의 정보를 보여줘야 할 듯
// 엔드포인트에 요청할 때, 루트 정보엔 이미 칼라가 있릍테니 그걸 받아서 쓰면 될 것 같음
declare global {
  interface Window {
    kakao: any;
  }
}
const kakao = window.kakao;

const colorsName = [
  'red',
  'orange',
  'yellow',
  'yellowGreen',
  'green',
  'sky',
  'blue',
  'purple',
  'pink',
];

function AllRoutesInMap() {
  const dispatch = useDispatch();
  /* redux 전역 상태관리 */ // 왜 type 할당 : RootState는 되고 RootPersistState는 안되나요 ?
  const colorUrls: any = useSelector(
    (state: RootState) => state.createRouteReducer.colorDotUrl,
  );
  const colorChips: any = useSelector(
    (state: RootState) => state.createRouteReducer.colorChip,
  );

  //state
  //지도의 확대 정도
  const [currLevel, setCurrLevel] = useState(8);
  //전체 루트의 정보
  const [allRoutes, setAllRoutes] = useState<Array<Route>>(fakeData.routes);
  const [prevAllRoutes, setPrevAllRoutes] = useState<Array<Route> | null>(null);

  // 루트 색상 정보
  const [colorIdx, setColorIdx] = useState<string>('');

  //핀 이미지 생성
  const pinImgSize = new kakao.maps.Size(16, 16);
  const pinImgOpt = { offset: new kakao.maps.Point(5, 8) };

  // *infoWindow 기본 css 없애는 함수
  function removeInfoWindowStyle(htmlTag: any): void {
    htmlTag.parentElement.parentElement.style.border = '0px';
    htmlTag.parentElement.parentElement.style.background = 'unset';
    htmlTag.parentElement.previousSibling.style.display = 'none';
  }

  //루트를 받아 핀 객체들을 만들고, 랜더링 한다.
  function generatePins(routeInfo: Route, map: any) {
    let pinColorUrl = '';
    for (let i = 0; i < colorsName.length; i++) {
      if (routeInfo.color === colorsName[i]) {
        pinColorUrl = colorUrls[i];
      }
    }
    const pinImgSrc = pinColorUrl;
    const pinImgObj = new kakao.maps.MarkerImage(
      pinImgSrc,
      pinImgSize,
      pinImgOpt,
    );
    for (const pin of routeInfo.Pins) {
      //루트의 색깔에 따라 핀의 이미지가 바뀌어야 한다.

      const pinObj = new kakao.maps.Marker({
        image: pinImgObj,
        map: map,
        position: new kakao.maps.LatLng(
          Number(pin.latitude),
          Number(pin.longitude),
        ),
        clickable: true,
      });

      //인포윈도우 설정
      const infoWindow = new kakao.maps.InfoWindow({ zIndex: 1 });
      // 마커 위에 마우스를 올렸을 때 발생되는 이벤트
      kakao.maps.event.addListener(pinObj, 'mouseover', function () {
        const content = InfoWindowContent(
          pin.locationName,
          pin.lotAddress,
          pin.roadAddress,
        );
        infoWindow.setContent(content);
        infoWindow.open(map, pinObj);
        // infoWindow 기본 css 없애기
        const infoWindowHTMLTags = document.querySelectorAll(
          '.windowInfo-content-container',
        );
        removeInfoWindowStyle(infoWindowHTMLTags[0]);
      });
      // 마커 위에서 마우스를 뗐을 때 발생되는 이벤트
      kakao.maps.event.addListener(pinObj, 'mouseout', function () {
        infoWindow.close();
      });
    }
  }

  function getRouteCenter(routeInfo: Route | null) {
    //선택된 핀의 정보가 없는 경우 기본값 반환
    if (routeInfo === null || routeInfo.Pins.length === 0) {
      return new kakao.maps.LatLng(37.566826, 126.9786567);
    }
    const minLat = routeInfo.Pins.reduce(
      (acc, cur) => Math.min(acc, Number(cur.latitude)),
      Number.MAX_SAFE_INTEGER,
    );
    const maxLat = routeInfo.Pins.reduce(
      (acc, cur) => Math.max(acc, Number(cur.latitude)),
      Number.MIN_SAFE_INTEGER,
    );
    const minLng = routeInfo.Pins.reduce(
      (acc, cur) => Math.min(acc, Number(cur.longitude)),
      Number.MAX_SAFE_INTEGER,
    );
    const maxLng = routeInfo.Pins.reduce(
      (acc, cur) => Math.max(acc, Number(cur.longitude)),
      Number.MIN_SAFE_INTEGER,
    );
    //소수 계산 문제를 해결하기 위해 toFixed함수를 사용해 16자리에서 반올림 해 평균을 계산한다
    // return new kakao.maps.LatLng(
    //   Number(((minLat + maxLat) / 2).toFixed(15)),
    //   Number(((minLng + maxLng) / 2).toFixed(15)),
    // );
    return { minLat, maxLat, minLng, maxLng };
  }

  async function getAllRoute(colorIdx: string) {
    const routeArray: Route[] = fakeData.routes;
    if (colorIdx === '') {
      setAllRoutes(routeArray);
    } else {
      const routeColor = colorsName[Number(colorIdx)];
      const colorFilterRoutes = [];
      for (let i = 0; i < routeArray.length; i++) {
        if (routeColor === routeArray[i].color) {
          colorFilterRoutes.push(routeArray[i]);
        }
      }
      //같은 배열이라면 set하지 않게 하는 함수
      function isSameRoute(before: Route[], after: Route[]) {
        for (let i = 0; i < before.length || i < after.length; i++) {
          if (before[i].id !== after[i].id) {
            return 'false';
          } else {
            continue;
          }
        }
        return 'true';
      }
      if (prevAllRoutes === null) return;
      console.log(isSameRoute(prevAllRoutes, allRoutes));
      if (isSameRoute(prevAllRoutes, allRoutes)) {
        return;
      }
      console.log('세팅된다');
      //같은 배열이 아니면 세팅해준다.
      setAllRoutes(colorFilterRoutes);
    }
    // 루트 배열을 받아온다.
    // const data = await axios.get('http://localhost/routes');
    // console.log(data);
    //받아온 루트 배열을 state 값으로 바꾼다.
    // setAllRoutes(data.data['routes']);
    // const tmp: Route[] = fakeData.routes;
    // console.log(tmp);
    // setAllRoutes(tmp);
  }

  useEffect(() => {
    //colorIdx가 빈 문자열일 경우모든 루트 배열을 받아온다.
    //colorIdx에 값이 있다면
    getAllRoute(colorIdx);
    console.log(allRoutes);
    console.log(colorIdx);
    // 지도 생성
    const mapContainer = document.getElementById('map');

    //전체 루트 중의 전체 센터값을 가져와야할 듯.
    const center = (routes: Route[] | null) => {
      let minLat = 90,
        maxLat = -90,
        minLng = 180,
        maxLng = -180;
      if (routes === null || routes.length === 0) {
        return new kakao.maps.LatLng(37.566826, 126.9786567);
      }
      for (const route of routes) {
        const corner = getRouteCenter(route);
        if (minLat > corner['minLat']) {
          minLat = corner['minLat'];
        }
        if (maxLat < corner['maxLat']) {
          maxLat = corner['maxLat'];
        }
        if (minLng > corner['minLng']) {
          minLng = corner['minLng'];
        }
        if (maxLng < corner['maxLng']) {
          maxLng = corner['maxLng'];
        }
      }
      return new kakao.maps.LatLng(
        Number(((minLat + maxLat) / 2).toFixed(15)),
        Number(((minLng + maxLng) / 2).toFixed(15)),
      );
    };
    const mapOptions = {
      center: center(allRoutes),
      level: currLevel,
    };

    const map = new kakao.maps.Map(mapContainer, mapOptions);

    //검색 후 핀과 선 랜더링
    if (allRoutes === null || allRoutes.length === 0) {
      //루트가 제대로 불러와지지 않았다면 제대로 된 루트가 불러와지지 않았다는 창을 띄워줘야 할 것 같음
      return;
    }
    for (const route of allRoutes) {
      //핀 생성
      generatePins(route, map);

      for (let i = 1; i < route.Pins.length; i++) {
        const prevLat = route.Pins[i - 1].latitude;
        const prevLng = route.Pins[i - 1].longitude;
        const linePath = [
          new kakao.maps.LatLng(prevLat, prevLng),
          new kakao.maps.LatLng(
            route.Pins[i].latitude,
            route.Pins[i].longitude,
          ),
        ];
        let polyColor = '';
        for (let i = 0; i < colorsName.length; i++) {
          if (route.color === colorsName[i]) {
            polyColor = colorChips[i];
          }
        }

        const polyline = new kakao.maps.Polyline({
          path: linePath,
          strokeWeight: 5,
          strokeColor: polyColor,
          strokeOpacity: 0.7,
          strokeStyle: 'solid',
        });
        polyline.setMap(map);
      }
    }
    setPrevAllRoutes(allRoutes);
  }, [allRoutes]);

  return (
    <div>
      <div className="jyang-allRoutesInMap">
        <ColorSelectBox setColorIdx={setColorIdx} />
      </div>
      <div id="map" style={{ width: '100%', height: '100vh' }}>
        <div className="allRoutesInMap-menu"></div>
      </div>
    </div>
  );
}

export default AllRoutesInMap;
