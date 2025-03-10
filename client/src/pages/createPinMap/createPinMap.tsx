import React, { useState, useEffect, useRef, useReducer } from 'react';
import ReactDOM from 'react-dom';
// redux
import { useSelector, useDispatch, batch } from 'react-redux';
import {
  savePinInfo,
  savePinImageFiles,
  savePinPosition,
} from '../../redux/actions/index';
import type { RootState } from './../../redux/reducer/index';
import { persistor } from '../../../src/index';
// other Files
import './createPinMap.css';
import createPinModal from '../../modals/createPinModal/createPinModal'; // 핀 생성 모달창
import SearchPinBar from '../../components/searchPinBar/searchPinBar'; // 핀 검색창
import ConfirmPinIsEmptyModal from '../../modals/confirmPinIsEmpty/confirmPinIsEmptyModal'; // 핀 오류 모달창
import ConfirmMoveToMypage from '../../modals/confirmRouteSave/confirmMoveToMypage'; // 마이페이지 이동 모달창
import ConfirmIsUserSaveRoute from '../../modals/confirmIsUserSaveRoute/confirmIsUserSaveRoute'; // 로그인 여부 확인 모달창
import SaveRouteModal from '../../modals/saveRouteModal/saveRouteModal'; // 루트 저장 모달창
import { InfoWindowContent } from '../../modals/pinContent/pinContent'; // infoWindow 창 생성하는 함수
import TimeLineSideBar from '../../components/timeLineSideBar/timeLineSideBar';
import Navigation from '../../components/navigation/Navigation';
import _ from 'lodash';
import '../../modals/createPinModal/createPinModal.css';
import Element from '../../modals/createPinModal/element';
import ElementCallBack from '../../modals/createPinModal/elemenCallBack';
import modifyPinModal from '../../modals/modifyPinModal/modifyPinModal';

const { kakao }: any = window;

/* [ 마커 여러개 가져올 때 지도 범위 재설정하는 메서드, setBounds() ]
 * [위도, 경도]세트들이 들어있는 배열을 받아 보관함 카드 모달창에서 지도 보여줄때 써먹기
 */

// 지도 핀 직접 찍는 메서드랑 검색 메서드 나누기 가능 ...? 루트 연결 가능 ??? 하 ..

function CreatePinMap() {
  /* redux 전역 상태관리 */ // 왜 type 할당 : RootState는 되고 RootPersistState는 안되나요 ?
  const routeState: any = useSelector(
    (state: RootState) => state.createRouteReducer,
  );
  const dispatch = useDispatch();
  const [markers, setMarkers] = useState([]);

  // *상태 관리
  const [currLevel, setCurrLevel] = useState(8); // 지도의 레벨
  const [blueMarkerLocation, setBlueMarkerLocation] = useState([
    37.566826, 126.9786567,
  ]); // 지도에 표시된 마커의 위도, 경도
  const [isModalOpen, setIsModalOpen] = useState(false); // 모달창 오픈 여부
  const [isModifyModalOpen, setIsModifyModalOpen] = useState(false); // 수정 모달창 오픈 여부
  const [searchText, setSearchText] = useState(''); // 검색창 단어
  const [isEmptyInfo, setIsEmptyInfo] = useState(false);
  const [isClickSaveBtn, setIsClickSaveBtn] = useState(false);
  const [isSidebarSaveBtnClicked, setIsSidebarSaveBtnClicked] = useState(false);
  const [isMoveToMypage, setIsMoveToMypage] = useState(false);
  const [isNotUserSave, setIsNotUserSave] = useState(false);

  const handleSidebarSaveBtn = (bool: boolean) => {
    setIsSidebarSaveBtnClicked(bool);
  };

  /*------------------------------------------------------------------------------------------------------------------*/
  const [currModifiedID, setCurrModifiedID] = useState('');
  const selectCurrModifedID = (id: string) => {
    setCurrModifiedID(id);
  };

  const [pinImage, setPinImage] = useState<any[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [pins, setPins] = useState([
    {
      pinID: null, // -------------> DB filed에는 없는, 내가 편하게 사용하려고 쓰는 상태 키
      ranking: null, // 핀 순서
      locationName: null, // 핀 제목
      latitude: null, // 핀 위도
      longitude: null, // 핀 경도
      lotAddress: null, // 핀 지번 주소
      roadAddress: null, // 핀 도로명 주소
      ward: null, // 핀 지역'구'
      startTime: '00:00', // 핀 시작 시간
      endTime: '01:00', // 핀 끝나는 시간
    },
  ]);
  const [itemState, setItemState] = useState<any[]>([]);
  const [newCounter, setNewCounter] = useState(itemState.length);
  const [isMouseOnCard, setIsMouseOnCard] = useState(false);
  const [currCardTitle, setCurrCardTitle] = useState(null);
  /* react-grid-layout */
  const onLayoutChange = (layout: any) => {
    setItemState(layout);

    const totalTime = pins
      ?.slice(1)
      .reduce((prev: any, curr: any, currIdx: number) => {
        const currSH = parseInt(layout[currIdx].y) * 0.5;
        const currEH = parseInt(layout[currIdx].y + layout[currIdx].h) * 0.5;
        const currTimes = currEH - currSH;
        return prev + currTimes;
      }, 0);
    setTotalTime(totalTime);

    const newTimePins: any = pins?.map((pin: any) => {
      layout.forEach((el: any, num: number) => {
        if (el.i === pin.pinID) {
          const sh = parseInt(el.y) * 0.5;
          const eh = parseInt(el.y + el.h) * 0.5;
          const getHour = (hour: any) =>
            Math.floor((hour * 60) / 60).toString().length === 1
              ? '0' + Math.floor((hour * 60) / 60)
              : Math.floor((hour * 60) / 60);
          const getMinute = (hour: any) =>
            ((hour * 60) % 60).toString() === '0'
              ? '0' + ((hour * 60) % 60)
              : (hour * 60) % 60;
          pin.startTime = getHour(sh) + ':' + getMinute(sh);
          pin.endTime = getHour(eh) + ':' + getMinute(eh); // 핀 시간 업데이트
          pin.ranking = num; // 핀 랭킹 업데이트
        }
      });
      return pin;
    });
    setPins(newTimePins);
  };
  const onMouseEnter = (locationName: any) => {
    // 이벤트 버블링 X
    setCurrCardTitle(locationName);
    setIsMouseOnCard(true);
  };
  const onMouseLeave = () => {
    // 이벤트 버블링 X
    setIsMouseOnCard(false);
  };

  const createElement = (el: any) => {
    const i = el.add ? '+' : el.i;
    const { pinID, locationName, startTime, endTime } = pins
      ?.slice(1)
      ?.filter((pin: any) => pin.pinID === el.i)[0];
    const sh = Number(startTime?.split(':')[0]);
    const eh = Number(endTime?.split(':')[0]);
    const sm = Number(startTime?.split(':')[1]);
    const em = Number(endTime?.split(':')[1]);
    // const height = (eh - sh) * 2 + (em - sm < 0 ? -1 : 0);
    const getTime = (sh: number, eh: number, sm: number, em: number) => {
      if (em - sm < 0) return eh - sh - 1 + 0.5;
      else {
        if (em - sm !== 0) return eh - sh + 0.5;
        if (em - sm === 0) return eh - sh;
      }
    };
    const time = getTime(sh, eh, sm, em);
    return (
      <div
        className="pinCard-container"
        data-grid={el}
        key={i}
        onMouseEnter={() => onMouseEnter(i)}
        onMouseLeave={onMouseLeave}
      >
        <div className="pinCard-title">{locationName}</div>
        {isMouseOnCard && currCardTitle === i ? (
          <div className="pinCard-btn-container">
            <button
              className="pinCard-delete-btn"
              onClick={() => onRemoveItem(i)}
            >
              삭제
            </button>
            <button
              className="pinCard-modify-btn"
              onClick={() => {
                selectCurrModifedID(i);
              }}
            >
              수정
            </button>
          </div>
        ) : (
          <div className="pinCard-time-container">
            <div className="pinCard-time-calculate">{time}</div>
            시간
          </div>
        )}
      </div>
    );
  };
  const onRemoveItem = (i: string) => {
    const updatedPins = pins.filter((el) => el.pinID !== i);
    const newState: any = _.reject(itemState, { i: i });
    const updatedRank = updatedPins.map((pin: any) => {
      newState.forEach((item: any, idx: number) => {
        if (item.i === pin.pinID) pin.ranking = idx;
      });
      return pin; // 랭킹값 업데이트 ...?!!
    });
    setItemState(newState);
    setPins(updatedRank);
  };
  const newID = 'pin' + newCounter; /* for ID */

  const onAddItem = (pinTitle: any, pinImages: any, currMarkerInfo: any) => {
    const newItems = itemState.concat({
      i: newID,
      x: 0,
      y: itemState.length * 2,
      w: 1,
      h: 2,
    });
    let keywords = pinTitle.split(' ');
    if (currMarkerInfo.lotAddress.length) {
      const letters = currMarkerInfo.lotAddress
        .split(' ')
        .filter((word: string) => word.slice(-1) !== '구');
      keywords = keywords.concat(letters);
    }
    const newPin: any = {
      pinID: newID, // -- 내가 만든 상태 키
      ranking: newCounter,
      locationName: pinTitle,
      latitude: currMarkerInfo.latitude,
      longitude: currMarkerInfo.longitude,
      lotAddress: currMarkerInfo.lotAddress,
      roadAddress: currMarkerInfo.roadAddress,
      ward: currMarkerInfo.ward,
      startTime: '00:00',
      endTime: '01:00',
      keywords: keywords,
    };
    const newFile: any = {
      ranking: newCounter,
      files: pinImages,
    };
    setPins(pins.concat(newPin));
    setItemState(newItems);
    setPinImage(pinImage.concat(newFile));
    setNewCounter(newCounter + 1);
    setIsClickSaveBtn(true);
    setMarkers((prev) => {
      prev.forEach((item: any) => item.setMap(null)); // 마커 싹 지우기 ... 될까 ..?
      return [];
    });
  };

  const onUpdateItem = (pinId: any, pinTitle: any, pinImages: any) => {
    const updatedPins = pins.map((el) => {
      if (el.pinID === pinId) {
        el.locationName = pinTitle; // 타이틀 교체
      }
      return el;
    });
    const updatedFiles = pinImage.map((el: any) => {
      if (el.ranking === Number(pinId.slice(3))) {
        el.files = pinImages;
      }
      return el;
    });
    setPins(updatedPins);
    setPinImage(updatedFiles);
  };

  let map: any = [];

  /* 파란 마커, 회색 마커 하나만 띄우기 */
  const [blueMarker, setBlueMarker] = useState(false);
  const [grayMarker, setGrayMarker] = useState(true);
  const handleBlueMarker = (boolean: boolean): void => {
    setBlueMarker(boolean);
  };
  const handleGrayMarker = (boolean: boolean): void => {
    setGrayMarker(boolean);
  };
  /* 클릭된 핀의 모든 주소 정보 */
  const [currMarkerInfo, setCurrMarkerInfo] = useState({
    latitude: 37.566826,
    longitude: 126.9786567,
    lotAddress: null,
    roadAddress: null,
    ward: null,
  });
  /* 저장버튼 클릭 상태 -> 이거 함수로 묶어줘야겄다 .. */
  /* 저장 버튼이 클릭되었다면 reducer로 action을 보내줍니다 --------------------------> 어쩔 수 없이 밖에 나와있는 이 로직.. 이벤트 핸들러를 나중에 붙이는 바람에 생기는 상태 업데이트 밀림*/
  /* redux-persist test */
  // const newPinID = pinPosition.reduce((acc: any, cur: any) => {
  //   const num1 = Number(acc?.pinID?.slice(3));
  //   const num2 = Number(cur?.pinID?.slice(3));
  //   return num1 > num2 ? num1 : num2;
  // }, 0);
  // const pinID = `pin${(newPinID || 0) + 1}`;
  // const ranking = Number(pinPosition?.length);
  // const latlng: any = [
  //   currMarkerInfo['latitude'],
  //   currMarkerInfo['longitude'],
  // ];
  // const formData = new FormData();
  // pinImages.forEach((img, idx: number) => {
  //   formData.append('imgFiles', pinImages[idx]);
  // });
  // // console.log(Array.from(formData)); // -> formData의 원래 형식 기억해둡시다. 최대한 형태 보존하면서 객체 안의 키값만 문자열로 바꿔놓긴했는데, 서버로 한꺼번에 보낼 때 잘 변환해서 드려야한다..!
  // const arr = Array.from(formData).map((el) => {
  //   const obj: any = {};
  //   const title = el[0];
  //   const imgInfo: any = el[1];
  //   for (const key in imgInfo) {
  //     obj[key] = String(imgInfo[key]);
  //   }
  //   return [title, obj];
  // });
  // batch(() => {
  //   // dispatch(savePinInfo(newID, newCounter, pinTitle, currMarkerInfo)); // 첫번째 저장은 빨리 됩니다.
  //   // dispatch(savePinImageFiles(pinID, ranking, arr));
  //   // dispatch(savePinPosition(pinID, pinTitle, latlng));
  // });
  // setSaveBtnClick(false);
  // // setPinTitle('');
  // // setPinImages([]);
  // // setPinImageNames([]);
  // /*---------- formData axios 요청 보낼 것. -> 핀 하나만 수정할 때 쓸 수 있는 폼 데이터 형식 ------------*/
  // // window의 formData 생성
  // const formData = new FormData();
  // const data = [
  //   {
  //     pinTitle: pinTitle,
  //   },
  // ];
  // pinImages.forEach((img, idx: number) => {
  //   formData.append('imgFiles', pinImages[idx]);
  // });
  // formData.append(
  //   'data',
  //   new Blob([JSON.stringify(data)], { type: 'application/json' }),
  // );
  // /*---------- formData axios 요청 보낼 것. -> 핀 하나만 수정할 때 쓸 수 있는 폼 데이터 형식 ------------*/
  /* 나 테스트 할거다. -----------------------------------------------------------------------------------------------------------------------------------*/

  // 핀 생성 모달창 open/close 핸들러 함수 (검색창으로 내려주고있어요)
  const handleIsModalOpen = (boolean: boolean): void => {
    // 모달창 HTMLElement가 남아있다면 제거하는 로직
    const modalTag = document.getElementById('createPinModal-background');
    if (modalTag) {
      modalTag.remove();
    }
    setIsModalOpen(boolean);
  };
  // 핀 수정 모달창 open/close 핸들러
  const handleIsModifyModalOpen = (boolean: boolean): void => {
    const modifyModalTag = document.getElementById('modifyPinModal-background');
    if (modifyModalTag) {
      modifyModalTag.remove();
    }
    setIsModifyModalOpen(boolean);
  };
  const getSearchText = (text: string): void => {
    // 검색창 검색어 핸들러 함수
    setSearchText(text);
  };

  const [lat, lng] = blueMarkerLocation;

  const sliceLatLng = (num: number): number => {
    const str = String(num);
    const [head, tail] = str.split('.');
    let slicedTail;
    if (head.length === 2) {
      slicedTail = tail.substring(0, 6);
    } else {
      slicedTail = tail.substring(0, 7);
    }
    const combineHeadTail = head + '.' + slicedTail;
    return Number(combineHeadTail);
  };

  // 주소-좌표 변환 객체 생성
  const geocoder: any = new kakao.maps.services.Geocoder();

  // 지도 주소 얻어오는 함수
  function searchDetailAddrFromCoords(coords: any, callback: any): any {
    geocoder.coord2Address(coords.getLng(), coords.getLat(), callback);
  }

  // *마커 이미지 생성
  const imageSrc = 'https://server.memory-road.net/upload/blue_marker.png';
  const imageSize = new kakao.maps.Size(33, 54);
  const imageOption = { offset: new kakao.maps.Point(16, 55) };
  const markerImage = new kakao.maps.MarkerImage(
    imageSrc,
    imageSize,
    imageOption,
  );
  // *마커
  const marker = new kakao.maps.Marker({
    image: markerImage,
    position: new kakao.maps.LatLng(lat, lng), // 현재 위치 상태 업데이트 반영
    clickable: true, // 클릭했을 때 지도의 클릭 이벤트가 발생하지 않도록 설정
  });
  // *마커 이미지 생성 - 검색용 마커
  const imageSrcForSearch =
    'https://server.memory-road.net/upload/gray_marker.png';
  const imageSizeForSearch = new kakao.maps.Size(33, 54);
  const imageOptionForSearch = { offset: new kakao.maps.Point(16, 55) };
  const markerImageForSearch = new kakao.maps.MarkerImage(
    imageSrcForSearch,
    imageSizeForSearch,
    imageOptionForSearch,
  );
  /* 핀 이미지 마커 */
  const savedMarkerImageSrc =
    'https://server.memory-road.net/upload/red_pin.png';
  const savedMarkerImageSize = new kakao.maps.Size(55, 54);
  const savedMarkerImage = new kakao.maps.MarkerImage(
    savedMarkerImageSrc,
    savedMarkerImageSize,
  );
  // 장소명 인포윈도우
  const infoWindow = new kakao.maps.InfoWindow({ zIndex: 0.9 });
  // 핀 생성 모달창 인포윈도우
  const infoWindowModal = new kakao.maps.InfoWindow({ zIndex: 1 });

  // *infoWindow 기본 css 없애는 함수
  function removeInfoWindowStyle(htmlTag: any): void {
    htmlTag.parentElement.parentElement.style.border = '0px';
    htmlTag.parentElement.parentElement.style.background = 'unset';
    htmlTag.parentElement.previousSibling.style.display = 'none';
  }
  // 핀 생성 모달창 이후에 위치를 변경할 수도 있겠다는 생각에 분리해놓은 함수
  function removeInfoWindowMoalStyleAndAddStyle(htmlTag: any): void {
    htmlTag.parentElement.parentElement.style.border = '0px';
    htmlTag.parentElement.parentElement.style.background = 'unset';
    htmlTag.parentElement.previousSibling.style.display = 'none';
  }

  useEffect(() => {
    const mapContainer = document.getElementById('map');
    // 지도의 option들
    const mapOptions = {
      center: new kakao.maps.LatLng(lat, lng), // -> 지도의 중심을 마커에 마추고싶다면 파란마커 회색마커 나눠서 진행할것.
      level: currLevel, // 지도의 확대 레벨 (분포도가 잘 보이는 레벨: 8) (지역이 잘 보이는 레벨: 3)
      draggable: true, // 마우스 드래그, 휠, 모바일 터치를 이용한 확대 및 축소 가능 여부
      scrollwheel: true, // 마우스 휠, 모바일 터치를 이용한 확대 및 축소 가능 여부
      disableDoubleClickZoom: true, // 마우스 더블 클릭으로 지도 확대 및 축소 불가능 여부
    };
    // 지도를 생성합니다
    map = new kakao.maps.Map(mapContainer, mapOptions);

    // *지도에 변화가 일어났을 때 실행되는 이벤트 핸들러 -> 시시각각 변하는 지도의 센터를 추적할 수 있음.
    kakao.maps.event.addListener(map, 'idle', function () {
      const level = map.getLevel();
      setCurrLevel(level); // 지도 레벨 상태 저장
    });

    /* 저장된 핀과 선을 지도에 표시 */
    const arrangedArr: any = itemState
      .sort((a: any, b: any) => a.y - b.y)
      .map((el: any) => el.i)
      .map((el) => {
        for (let i = 0; i < pins.length; i++) {
          if (pins[i].pinID === el) {
            return pins[i];
          }
        }
      });
    // 범위 설정하는 건 좀 있다가.
    const bounds = new kakao.maps.LatLngBounds();
    pins
      .slice(1)
      .map((el) =>
        bounds.extend(new kakao.maps.LatLng(el.latitude, el.longitude)),
      );
    for (let i = 0; i < arrangedArr.length; i++) {
      if (arrangedArr[i]) {
        const currLat: any = arrangedArr[i].latitude;
        const currLng: any = arrangedArr[i].longitude;
        const savedMarker = new kakao.maps.Marker({
          image: savedMarkerImage,
          position: new kakao.maps.LatLng(currLat, currLng), // 마커 생성
          clickable: true,
        });
        if (i >= 1) {
          const prevLat: any = arrangedArr[i - 1].latitude;
          const prevLng: any = arrangedArr[i - 1].longitude;
          const linePath = [
            new kakao.maps.LatLng(prevLat, prevLng),
            new kakao.maps.LatLng(currLat, currLng),
          ];
          const polyline = new kakao.maps.Polyline({
            path: linePath,
            strokeWeight: 5,
            strokeColor: '#eb3838',
            strokeOpacity: 0.7,
            strokeStyle: 'dashed',
          });
          polyline.setMap(map);
          setMarkers((prev) => prev.concat(polyline));
        }
        savedMarker.setMap(map);
        // 모든 마커 기록
        setMarkers((prev) => prev.concat(savedMarker));
        /* pin 수정 모달창 띄우기 */
        if (currModifiedID.length && arrangedArr[i].pinID === currModifiedID) {
          map.setBounds(bounds); // 수정할 땐 bound 가까이에.
          handleIsModifyModalOpen(true);
          infoWindowModal.setContent(modifyPinModal);
          infoWindowModal.open(map, savedMarker);
          const infoWindowModalHTMLTag = document.querySelector(
            '#modifyPinModal-background',
          );
          removeInfoWindowMoalStyleAndAddStyle(infoWindowModalHTMLTag);
          const currInfoForModify = arrangedArr[i]; // 현재 pin의 개수와 layout 개수가 일치하지 않습니다.
          const currFileForModify = pinImage[i];

          ReactDOM.render(
            <ElementCallBack
              currFileForModify={currFileForModify}
              currInfoForModify={currInfoForModify}
              handleIsModifyModalOpen={handleIsModifyModalOpen}
              onUpdateItem={onUpdateItem}
              selectCurrModifedID={selectCurrModifedID}
            />,
            document.getElementById('modifyPinModal-background'),
          );
        }
        /* pin 수정 모달창 띄우기 */
      }
    }
    // *마커 생성
    if (blueMarker) marker.setMap(map);
    kakao.maps.event.addListener(marker, 'click', function () {
      // -> infoWindow를 개조해서 가는 걸로 결정.
      handleIsModalOpen(true); // 모달창 오픈 여부 상태 저장
      infoWindowModal.setContent(createPinModal);
      infoWindowModal.open(map, marker);
      // infoWindow 기본 css 없애기
      const infoWindowModalHTMLTag = document.querySelector(
        '#createPinModal-background',
      );
      removeInfoWindowMoalStyleAndAddStyle(infoWindowModalHTMLTag);

      ReactDOM.render(
        <Element
          currMarkerInfo={currMarkerInfo}
          handleIsModalOpen={handleIsModalOpen}
          onAddItem={onAddItem}
          setIsEmptyInfo={setIsEmptyInfo}
        />,
        document.getElementById('createPinModal-background'),
      );
    });
    // *마커 지도에 얹기
    kakao.maps.event.addListener(map, 'click', function (mouseEvent: any) {
      searchDetailAddrFromCoords(
        mouseEvent.latLng,
        function (result: any, status: any): void {
          if (status === kakao.maps.services.Status.OK) {
            const latlng = mouseEvent.latLng; // 클릭한 위도, 경도 정보를 가져옴
            const level = map.getLevel();
            marker.setMap(null);
            infoWindowModal.close();
            marker.setPosition(latlng); // 마커 위치를 클릭한 위치로 옮김 - setPosition
            // 모든 마커 기록
            setMarkers((prev) => prev.concat(marker));

            const latlngMarker: Array<number> = [
              sliceLatLng(latlng.Ma),
              sliceLatLng(latlng.La),
            ];
            setBlueMarkerLocation(latlngMarker); // [latlng.Ma, latlng.La] 위도와 경도 배열로 뽑아낼 수 있음. -> 현재 테스트중입니다.
            setCurrLevel(level);
            // setPinTitle(null);

            const place = result[0].address;
            const blueMinfo: any = {
              latitude: sliceLatLng(latlng.Ma), // 위도
              longitude: sliceLatLng(latlng.La), // 경도
              lotAddress: place.address_name, // 지번 주소
              roadAddress: !!place.road_address
                ? place.road_address.address_name
                : '', // 도로명 주소
              ward: place.region_2depth_name, // 지역 '구'
            };
            setCurrMarkerInfo(blueMinfo);
          }
        },
      );
    });
    // 장소 검색 이벤트 모음
    const ps = new kakao.maps.services.Places();
    if (grayMarker) ps.keywordSearch(searchText, placesSearchCB);

    function placesSearchCB(data: any, status: any, pagination: any) {
      if (status === kakao.maps.services.Status.OK) {
        // const bounds = new kakao.maps.LatLngBounds();
        if (isModalOpen) infoWindowModal.close();
        if (isModifyModalOpen) infoWindowModal.close();

        for (let i = 0; i < data.length; i++) {
          displayMarker(data[i]);
          // bounds.extend(new kakao.maps.LatLng(data[i].y, data[i].x));
        }

        // 검색된 장소 위치를 기준으로 지도 범위를 재설정 과연 필수인가
        // map.setBounds(bounds);
      } else if (status === kakao.maps.services.Status.ZERO_RESULT) {
        alert('검색 결과가 존재하지 않습니다.');
        return;
      } else if (status === kakao.maps.services.Status.ERROR) {
        alert('검색 결과 중 오류가 발생했습니다.');
        return;
      }
    }
    function displayMarker(place: any) {
      // *마커 - 검색용
      const markerForSearch = new kakao.maps.Marker({
        image: markerImageForSearch,
        map: map,
        position: new kakao.maps.LatLng(
          sliceLatLng(place.y),
          sliceLatLng(place.x),
        ),
        clickable: true, // 클릭했을 때 지도의 클릭 이벤트가 발생하지 않도록 설정
      });
      // 모든 마커 저장
      setMarkers((prev) => prev.concat(markerForSearch));
      // 검색용 마커 클릭했을 때 발생되는 이벤트
      kakao.maps.event.addListener(markerForSearch, 'click', function () {
        handleIsModalOpen(true);
        infoWindowModal.setContent(createPinModal);
        infoWindowModal.open(map, markerForSearch);
        // infoWindow 기본 css 없애기
        const infoWindowModalHTMLTag = document.querySelector(
          '#createPinModal-background',
        );
        removeInfoWindowMoalStyleAndAddStyle(infoWindowModalHTMLTag);

        const grayMinfo: any = {
          latitude: sliceLatLng(place.y),
          longitude: sliceLatLng(place.x),
          lotAddress: place.address_name,
          roadAddress: !!place.road_address_name ? place.road_address_name : '',
          ward: place.address_name.split(' ')[1],
        };
        // setCurrMarkerInfo(grayMinfo);

        ReactDOM.render(
          <Element
            currMarkerInfo={grayMinfo}
            handleIsModalOpen={handleIsModalOpen}
            onAddItem={onAddItem}
            setIsEmptyInfo={setIsEmptyInfo}
          />,
          document.getElementById('createPinModal-background'),
        );
      });

      // 검색용 마커 위에 마우스를 올렸을 때 발생되는 이벤트
      kakao.maps.event.addListener(markerForSearch, 'mouseover', function () {
        const content = InfoWindowContent(
          place.place_name,
          place.address_name,
          place.road_address_name,
        );
        infoWindow.setContent(content);
        infoWindow.open(map, markerForSearch);
        // infoWindow 기본 css 없애기
        const infoWindowHTMLTags = document.querySelectorAll(
          '.windowInfo-content-container',
        );
        removeInfoWindowStyle(infoWindowHTMLTags[0]);
      });
      // 검색용 마커 위에서 마우스를 뗐을 때 발생되는 이벤트
      kakao.maps.event.addListener(markerForSearch, 'mouseout', function () {
        infoWindow.close();
      });
    }
  }, [
    blueMarkerLocation,
    searchText,
    blueMarker,
    grayMarker,
    currMarkerInfo,
    isClickSaveBtn,
    currModifiedID,
    itemState,
  ]); // -------------------------------------------------------------------------------------------> test
  return (
    <>
      <div id="map-whole-container">
        {isNotUserSave ? (
          <ConfirmIsUserSaveRoute setIsNotUserSave={setIsNotUserSave} />
        ) : null}
        {isMoveToMypage ? (
          <ConfirmMoveToMypage setIsMoveToMypage={setIsMoveToMypage} />
        ) : null}
        {isEmptyInfo ? (
          <ConfirmPinIsEmptyModal setIsEmptyInfo={setIsEmptyInfo} />
        ) : null}
        {isSidebarSaveBtnClicked ? (
          <SaveRouteModal
            handleSidebarSaveBtn={handleSidebarSaveBtn}
            pinImage={pinImage}
            pins={pins}
            setIsMoveToMypage={setIsMoveToMypage}
            setIsNotUserSave={setIsNotUserSave}
            totalTime={totalTime}
          />
        ) : null}
        <div id="map-navigator-top">
          <Navigation />
          <TimeLineSideBar
            createElement={createElement}
            handleSidebarSaveBtn={handleSidebarSaveBtn}
            itemState={itemState}
            onLayoutChange={onLayoutChange}
            // pinCards={pinCards}
          />
          <SearchPinBar
            getSearchText={getSearchText}
            handleBlueMarker={handleBlueMarker}
            handleGrayMarker={handleGrayMarker}
            handleIsModalOpen={handleIsModalOpen}
          />
        </div>
        <div id="map"></div>
      </div>
    </>
  );
}

export default CreatePinMap;
