import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from './../../redux/reducer/index';
import axios from 'axios';
import './saveRouteModal.css';
import { addPinImageFiles } from '../../redux/actions';

function SaveRouteModalForModify({
  handleSidebarSaveBtn,
  pins,
  route,
  totalTime,
  routeId,
  setIsMoveToMypage,
}: any) {
  const colorUrls: any = useSelector(
    (state: RootState) => state.createRouteReducer.colorDotUrl,
  );
  const colorNames: any = useSelector(
    (state: RootState) => state.createRouteReducer.colorName,
  );

  const [initialYear, initialMonth, initialDate] = route.createdAt
    .slice(0, 10)
    .split('-');
  const initialColorIdx = colorNames.indexOf(route.color);

  const [clickedColorSelect, setClickedColorSelect] = useState(false);
  const [clickedDaySelect, setClickedDaySelect] = useState(false);
  const [clickedMonthSelect, setClickedMonthSelect] = useState(false);
  const [clickedYearSelect, setClickedYearSelect] = useState(false);
  const [selectedColorId, setSelectedCorlorId] = useState(initialColorIdx);
  const [selectedDay, setSelectedDay] = useState(Number(initialDate) - 1);
  const [selectedMonth, setSelectedMonth] = useState(Number(initialMonth) - 1);
  const [selectedYear, setSelectedYear] = useState(initialYear);

  const handleColorSelect = () => {
    setClickedColorSelect(!clickedColorSelect);
    setClickedDaySelect(false);
    setClickedMonthSelect(false);
    setClickedYearSelect(false);
  };
  const selectColor = (event: any) => {
    setSelectedCorlorId(event.target.id);
  };
  const handleDaySelect = () => {
    setClickedDaySelect(!clickedDaySelect);
    setClickedColorSelect(false);
    setClickedMonthSelect(false);
    setClickedYearSelect(false);
  };
  const selectDay = (event: any) => {
    setSelectedDay(event.target.id);
  };
  const handleMonthSelect = () => {
    setClickedMonthSelect(!clickedMonthSelect);
    setClickedColorSelect(false);
    setClickedDaySelect(false);
    setClickedYearSelect(false);
  };
  const selectMonth = (event: any) => {
    setSelectedMonth(event.target.id);
  };
  const handleYearSelect = () => {
    setClickedYearSelect(!clickedYearSelect);
    setClickedMonthSelect(false);
    setClickedColorSelect(false);
    setClickedDaySelect(false);
  };
  const selectYear = (event: any) => {
    setSelectedYear(event.target.id);
  };
  const [routeTitle, setRouteTitle] = useState(route.routeName);
  const [routeDesc, setRouteDesc] = useState(route.description);
  const [isOpenRoute, setIsOpenRoute] = useState(route.public);

  const handleRouteTitle = (event: any) => {
    setRouteTitle(event.target.value);
  };
  const handleRouteDesc = (event: any) => {
    setRouteDesc(event.target.value);
  };
  const handleRouteOpenOrUnopen = () => {
    setIsOpenRoute(!isOpenRoute);
  };

  /* 저장 버튼 눌렀을 때 일어나는 이벤트 */
  const saveAllPinAndRouteInfo = () => {
    if (
      routeTitle.length &&
      routeDesc.length &&
      Number(selectedYear) &&
      selectedMonth !== null &&
      selectedDay !== null
    ) {
      // 핀 제목, 핀 사진 수정 endpoint
      pins.slice(1).forEach((el: any) => {
        // 키워드 생성 과연.
        let keywords: any = el.locationName.split(' ');
        if (el.lotAddress.length) {
          const letters = el.lotAddress
            .split(' ')
            .filter((word: string) => word.slice(-1) !== '구');
          keywords = keywords.concat(letters);
        }
        if (el.roadAddress.length) {
          const letters = el.roadAddress
            .split(' ')
            .filter((word: string) => word.slice(-1) !== '구');
          keywords = keywords.concat(letters);
        }
        const pinId = Number(el.id);
        const formData = new FormData();
        const data = {
          locationName: el.locationName,
          ranking: el.ranking,
          latitude: Number(el.latitude),
          longitude: Number(el.longitude),
          lotAddress: el.lotAddress,
          roadAddress: el.roadAddress,
          startTime: el.startTime,
          endTime: el.endTime,
          ward: el.ward,
          keywords: keywords,
        };
        // console.log('el.Pictures', el.Pictures);
        formData.append('pin', JSON.stringify(data));
        // formData.append(`${el.ranking}`, newFiles);
        // el에 Pictures 배열이 없을수도 있다는 사실을 간과했다.
        if (el.Pictures) {
          el.Pictures.forEach((file: any) => {
            if (file.name) {
              formData.append('files', file);
            }
          });
        }

        axios({
          url: `https://server.memory-road.net/routes/${routeId}/pins/${pinId}`,
          method: 'patch',
          data: formData,
          withCredentials: true,
        })
          .then((res) => {
            if (res.status === 200) {
              console.log(res);
            }
          })
          .catch((err) => {
            console.log(err);
          });
      });

      // 루트 제목, 루트 내용 수정 endpoint
      axios({
        url: `https://server.memory-road.net/routes/${routeId}`,
        method: 'patch',
        data: {
          routeName: routeTitle,
          description: routeDesc,
          public: !isOpenRoute,
          color: colorNames[Number(selectedColorId)],
          date: `${selectedYear}-${Number(selectedMonth) + 1}-${
            Number(selectedDay) + 1
          }`,
          time: totalTime,
        },
        withCredentials: true,
      })
        .then((res) => {
          if (res.status === 200) {
            console.log(res);
            handleSidebarSaveBtn(false);
            setIsMoveToMypage(true);
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
  return (
    <>
      <div className="saveRouteModal-background">
        <div className="saveRouteModal-container">
          <div className="saveRouteModal-content">
            <p className="saveRouteModal-text">
              수정된 루트를 저장하시겠습니까 ?
            </p>
            <div className="saveRouteModal-selectZone">
              {/* ------------------------------------------------------ */}
              <div
                className={
                  'saveRouteModal-selectbox-year ' +
                  (clickedYearSelect ? 'btn-active' : null)
                }
              >
                <button
                  className="saveRouteModal-selectbox-year-label"
                  onClick={handleYearSelect}
                >
                  <p className="saveRouteModal-selectbox-year-selected-option">
                    {Number(selectedYear) === 0 ? '년도' : Number(selectedYear)}
                  </p>
                </button>
                <ul className="saveRouteModal-selectbox-year-optionList">
                  {new Array(100).fill(0).map((el, idx) => (
                    <li
                      className="saveRouteModal-selectbox-year-option"
                      id={String(2022 - idx)}
                      key={idx}
                      onClick={(event) => {
                        selectYear(event);
                        handleYearSelect();
                      }}
                      onKeyPress={selectYear}
                      role="tab"
                    >
                      {2022 - idx}
                    </li>
                  ))}
                </ul>
              </div>
              {/* ------------------------------------------------------ */}
              <div
                className={
                  'saveRouteModal-selectbox-month ' +
                  (clickedMonthSelect ? 'btn-active' : null)
                }
              >
                <button
                  className="saveRouteModal-selectbox-month-label"
                  onClick={handleMonthSelect}
                >
                  <p className="saveRouteModal-selectbox-month-selected-option">
                    {selectedMonth === null ? '월' : Number(selectedMonth) + 1}
                  </p>
                </button>
                <ul className="saveRouteModal-selectbox-month-optionList">
                  {new Array(12).fill(0).map((el, idx) => (
                    <li
                      className="saveRouteModal-selectbox-month-option"
                      id={String(idx + 1)}
                      key={idx + 1}
                      onClick={(event) => {
                        selectMonth(event);
                        handleMonthSelect();
                      }}
                      onKeyPress={selectMonth}
                      role="tab"
                    >
                      {idx + 1}
                    </li>
                  ))}
                </ul>
              </div>
              {/* ------------------------------------------------------ */}
              <div
                className={
                  'saveRouteModal-selectbox-day ' +
                  (clickedDaySelect ? 'btn-active' : null)
                }
              >
                <button
                  className="saveRouteModal-selectbox-day-label"
                  onClick={handleDaySelect}
                >
                  <p className="saveRouteModal-selectbox-day-selected-option">
                    {selectedDay === null ? '일' : Number(selectedDay) + 1}
                  </p>
                </button>
                <ul className="saveRouteModal-selectbox-day-optionList">
                  {new Array(31).fill(0).map((el, idx) => (
                    <li
                      className="saveRouteModal-selectbox-day-option"
                      id={String(idx + 1)}
                      key={idx + 1}
                      onClick={(event) => {
                        selectDay(event);
                        handleDaySelect();
                      }}
                      onKeyPress={selectDay}
                      role="tab"
                    >
                      {idx + 1}
                    </li>
                  ))}
                </ul>
              </div>
              {/* ------------------------------------------------------ */}
              <div
                className={
                  'saveRouteModal-selectbox-color ' +
                  (clickedColorSelect ? 'btn-active' : null)
                }
              >
                <button
                  className="saveRouteModal-selectbox-color-label"
                  onClick={handleColorSelect}
                >
                  <img
                    alt="selected-dot"
                    className="saveRouteModal-selectbox-color-selected-option"
                    src={colorUrls[Number(selectedColorId)]}
                  />
                </button>
                <ul className="saveRouteModal-selectbox-color-optionList">
                  {colorUrls.map((color: any, idx: any) => {
                    const strArr = color.split('/');
                    return (
                      <li
                        className="saveRouteModal-selectbox-color-option"
                        id={String(idx)}
                        key={idx}
                        onClick={(event) => {
                          selectColor(event);
                          handleColorSelect();
                        }}
                        onKeyPress={selectColor}
                        role="tab"
                      >
                        <img
                          alt={strArr[6]}
                          className="saveRouteModal-selectbox-color-img"
                          id={String(idx)}
                          src={color}
                        />
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
            <textarea
              className="saveRouteModal-route-title-input"
              onChange={handleRouteTitle}
              placeholder="루트의 제목을 입력해주세요."
              value={routeTitle}
            ></textarea>
            <textarea
              className="saveRouteModal-route-content-input"
              onChange={handleRouteDesc}
              placeholder="루트에 대한 간단함 감상을 적어보세요."
              value={routeDesc}
            ></textarea>
            <div className="saveRouteModal-open-unopen">
              🔐
              <label className="saveRouteModal-switch">
                <input
                  checked={!isOpenRoute}
                  onChange={handleRouteOpenOrUnopen}
                  type="checkbox"
                />
                <span className="saveRouteModal-slider-circle"></span>
              </label>
            </div>
            <button
              className="saveRouteModal-save-btn"
              onClick={() => saveAllPinAndRouteInfo()}
            >
              루트 수정 완료
            </button>
            <button
              className="saveRouteModal-close-btn"
              onClick={() => handleSidebarSaveBtn(false)}
            >
              조금 더 수정해볼게요
            </button>
          </div>
          <p className="saveRouteModal-last-text">MeMoryRoad</p>
        </div>
      </div>
    </>
  );
}

export default SaveRouteModalForModify;
