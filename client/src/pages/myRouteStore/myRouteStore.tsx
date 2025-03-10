import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/reducer/index';
// import Navigation from '../../components/Navigation/';
import Navigation from '../../components/navigation/Navigation';
import ColorSelectBox from '../../components/colorSelectBox/colorSelectBoxForStore';
import SeoulSelectBox from '../../components/seoulSelectBox/seoulSelectBoxForStore';
import WardSelectBox from '../../components/wardSelectBox/wardSelectBoxForStore';
import StoryCard from '../../components/storyCard/storyCardForStore';
import Pagination from '../../components/pagination/paginationForStore';
import StoryCardMainModal from '../../modals/storyCardMainModal/storyCardMainModal';
import './myRouteStore.css';
import { testData } from './textData';
import _ from 'lodash';
import axios from 'axios';

function MyRouteStore() {
  const navigate = useNavigate();
  const colorNames = useSelector(
    (state: RootState): Array<string> => state.createRouteReducer.colorName,
  );
  const wardNames = useSelector(
    (state: RootState): Array<string> => state.createRouteReducer.wards,
  );
  const [clickedColorSelect, setClickedColorSelect] = useState(false);
  const [clickedSeoulSelect, setClickedSeoulSelect] = useState(false);
  const [clickedWardSelect, setClickedWardSelect] = useState(false);
  const [selectedColorId, setSelectedCorlorId] = useState(0);
  const [selectedSeoul, setSelectedSeoul] = useState(0);
  const [selectedWard, setSelectedWard] = useState('');

  const [paginationNum, setPaginationNum] = useState(0); // <, > 버튼 컨트롤
  const [currPageNum, setCurrPageNum] = useState(1); // 페이지 넘버(1,2,3) 컨트롤
  const [dataCount, setdataCount] = useState(0); // 전체 루트 개수
  const [routeCards, setRouteCards] = useState([]); // server에서 받아온 데이터 모음
  const [originRouteCards, setOriginRouteCards] = useState([]); // 변경되지않는 기존값.

  // if (clickedColorSelect || clickedWardSelect) {
  //   if (selectedColorId !== 0 && selectedWard !== 0) {
  //     const filteredRouteCards = originRouteCards
  //       .filter((el: any) =>
  //         el.color === colorNames[selectedColorId] ? true : false,
  //       )
  //       .filter((el: any) => {
  //         const pinsWards = el.Pins.map((pin: any) => pin.ward);
  //         return pinsWards.indexOf(selectedWard) !== -1 ? true : false;
  //       });
  //     setRouteCards(filteredRouteCards);
  //     setClickedColorSelect(false);
  //     setClickedWardSelect(false);
  //   } else if (selectedColorId !== 0) {
  //     const filteredRouteCards = originRouteCards.filter((el: any) =>
  //       el.color === colorNames[selectedColorId] ? true : false,
  //     );
  //     setRouteCards(filteredRouteCards); // 색상이 선택되었을 때 상태 업데이트
  //     setClickedColorSelect(false);
  //     setClickedWardSelect(false);
  //   } else if (selectedWard !== 0) {
  //     const filteredRouteCards = originRouteCards.filter((el: any) => {
  //       const pinsWards = el.Pins.map((pin: any) => pin.ward);
  //       return pinsWards.indexOf(selectedWard) !== -1 ? true : false;
  //     });
  //     setRouteCards(filteredRouteCards); // 구 이름이 선택되었을 때 상태 업데이트
  //     setClickedColorSelect(false);
  //     setClickedWardSelect(false);
  //   } else {
  //     setRouteCards(originRouteCards);
  //   }
  // }

  const handleColorSelect = () => {
    setClickedColorSelect(!clickedColorSelect);
    setClickedSeoulSelect(false);
    setClickedWardSelect(false);
  };
  const handleSeoulSelect = () => {
    setClickedSeoulSelect(!clickedSeoulSelect);
    setClickedColorSelect(false);
    setClickedWardSelect(false);
  };
  const handleWardSelect = () => {
    setClickedWardSelect(!clickedWardSelect);
    setClickedColorSelect(false);
    setClickedSeoulSelect(false);
  };
  // 어설픈 기능.
  const selectColor = (event: any) => {
    const idx = Number(event.target.id);
    setSelectedCorlorId(idx);
    setRouteCards((prev) => {
      if (idx === 0 && selectedWard === '') {
        // 모두 초기화
        return originRouteCards;
      } else if (idx === 0 && selectedWard === '전체 구') {
        return originRouteCards;
      } else if (idx === 0 && selectedWard !== '전체 구') {
        // 와드 값
        const newData = originRouteCards.filter((el: any) => {
          for (const pin of el.Pins) {
            if (pin.ward === selectedWard) return true;
          }
          return false;
        });
        return newData;
      } else if (
        (idx !== 0 && selectedWard === '') ||
        (idx !== 0 && selectedWard === '전체 구')
      ) {
        const newData = originRouteCards.filter((el: any) =>
          el.color === colorNames[idx] ? true : false,
        );
        return newData;
      } else if (idx !== 0 && selectedWard !== '전체 구') {
        // 색상, 와드 값
        const newData = originRouteCards
          .filter((el: any) => (el.color === colorNames[idx] ? true : false))
          .filter((el: any) => {
            for (const pin of el.Pins) {
              if (pin.ward === selectedWard) return true;
            }
            return false;
          });
        return newData;
      } else {
        // 색상만
        const newData = originRouteCards.filter((el: any) =>
          el.color === colorNames[idx] ? true : false,
        );
        return newData;
      }
    });
  };
  const selectSeoul = (event: any) => {
    setSelectedSeoul(event.target.id);
  };
  const selectWard = (event: any) => {
    const wardName = event.target.id;
    setSelectedWard(wardName);
    setRouteCards((prev) => {
      if (selectedColorId === 0 && wardName === '전체 구') {
        // 모두 초기화
        return originRouteCards;
      } else if (selectedColorId === 0 && wardName === '') {
        return originRouteCards;
      } else if (selectedColorId !== 0 && selectedWard === '전체 구') {
        // 와드 값
        const newData = originRouteCards.filter((el: any) =>
          el.color === colorNames[selectedColorId] ? true : false,
        );
        return newData;
      } else if (selectedColorId !== 0 && selectedWard !== '전체 구') {
        // 색상, 와드 값
        const newData = originRouteCards
          .filter((el: any) =>
            el.color === colorNames[selectedColorId] ? true : false,
          )
          .filter((el: any) => {
            for (const pin of el.Pins) {
              if (pin.ward === wardName) return true;
            }
            return false;
          });
        return newData;
      } else {
        // 와드값만
        const newData = originRouteCards.filter((el: any) => {
          for (const pin of el.Pins) {
            if (pin.ward === wardName) return true;
          }
          return false;
        });
        return newData;
      }
    });
  };

  /* pagination */
  const count8 =
    Math.floor(dataCount / 8) + (Math.floor(dataCount % 8) > 0 ? 1 : 0);
  const pages = [];
  for (let i = 1; i <= count8; i++) {
    pages.push(i);
  }
  const dividedPages = _.chunk(pages, 5); // 예쁘게 5개로 묶기.
  const handleClickedPageNum = (pageNum: number): void => {
    setCurrPageNum(pageNum); /* 페이지네이션 업데이트 */
  };
  const handlePrevPaginationNum = () => {
    setPaginationNum(paginationNum - 1);
    setCurrPageNum((paginationNum - 1) * 5 + 1); // 이전페이지 맨 첫 장
  };
  const handleNextPaginationNum = () => {
    setPaginationNum(paginationNum + 1);
    setCurrPageNum((paginationNum + 1) * 5 + 1); // 이후페이지 맨 첫 장
  };
  /* card modal */
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [currModalData, setCurrModalData] = useState([]);
  const handleCardModalOpen = (routeId: number) => {
    const currRouteCardData = routeCards.filter((el: any) =>
      el.id === routeId ? true : false,
    );
    setCurrModalData(currRouteCardData);
    setIsCardModalOpen(true);
  };
  const handleCardModalClose = () => {
    setIsCardModalOpen(false);
  };
  const addImageUrl = 'https://server.memory-road.net/upload/plus_button.png';

  useEffect(() => {
    if (currPageNum !== 0) {
      axios({
        url: 'https://server.memory-road.net/routes',
        method: 'get',
        withCredentials: true,
        params: {
          page: currPageNum,
        },
      })
        .then((res: any) => {
          if (res.status === 200) {
            console.log(res);
            setRouteCards(res.data.routes); // 배열값
            setOriginRouteCards(res.data.routes);
            setdataCount(res.data.count);
            setCurrPageNum(0);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  }, [currPageNum]);

  return (
    <>
      {isCardModalOpen ? (
        <StoryCardMainModal
          handleCardModalClose={handleCardModalClose}
          routeInfo={currModalData}
        />
      ) : null}
      <div className="myRouteStore-wrapper">
        <Navigation />
        <div className="myRouteStore-background">
          <div className="myRouteStore-container">
            <p className="myRouteStore-title">내 루트 보관함</p>
            <hr className="myRouteStore-divide-line"></hr>
            <div className="myRouteStore-selectZone">
              <div className="myRouteStore-selectBoxZone">
                <ColorSelectBox
                  clickedColorSelect={clickedColorSelect}
                  handleColorSelect={handleColorSelect}
                  selectColor={selectColor}
                  selectedColorId={selectedColorId}
                />
                <SeoulSelectBox
                  clickedSeoulSelect={clickedSeoulSelect}
                  handleSeoulSelect={handleSeoulSelect}
                  selectSeoul={selectSeoul}
                />
                <WardSelectBox
                  clickedWardSelect={clickedWardSelect}
                  handleWardSelect={handleWardSelect}
                  selectWard={selectWard}
                  selectedWard={selectedWard}
                />
              </div>
              {/* <div className="myRouteStore-searchBoxZone">
                <input
                  className="myRouteStore-search-input"
                  onChange={selectSearchWord}
                  placeholder="검색어를 입력해주세요"
                ></input>
                <button
                  className="myRouteStore-search-btn"
                  onClick={() => searchCard()}
                >
                  검색
                </button>
              </div> */}
            </div>
            <hr className="myRouteStore-divide-line"></hr>
            <div className="myRouteStore-createRouteBox-align">
              <div className="myRouteStore-contentBox">
                {/* 여기서 중앙정렬 ?~! */}
                <div className="myRouteStore-contents">
                  <button
                    className="myRouteStore-createRouteBox-btn"
                    onClick={() => {
                      navigate('/createRoute');
                    }}
                  >
                    <img
                      alt="addButton"
                      className="myRouteStore-createRouteBox-add-image"
                      src={addImageUrl}
                    ></img>
                  </button>
                  {/* 카드 나열 */}
                  {routeCards?.map((el, idx) => (
                    <StoryCard
                      handleCardModalOpen={handleCardModalOpen}
                      key={idx}
                      route={el}
                    />
                  ))}
                </div>
                <div className="myRouteStore-paginations-wrapper">
                  <div className="myRouteStore-paginations">
                    <Pagination
                      dividedPages={dividedPages}
                      handleClickedPageNum={handleClickedPageNum}
                      handleNextPaginationNum={handleNextPaginationNum}
                      handlePrevPaginationNum={handlePrevPaginationNum}
                      paginationNum={paginationNum}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default MyRouteStore;
