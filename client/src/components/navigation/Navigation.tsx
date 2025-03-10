import React from 'react';
import './Navigation.css';
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import OpenedMenu from '../openedmenu/openedmenu';
import { useNavigate } from 'react-router-dom';
import { RootState } from '../../redux/reducer';
import { loginModal, setUserInfo } from '../../redux/actions/index';
import LoginModal from '../../modals/login/Login';
import SignUp from '../../modals/signup/Signup';
import CheckingPassword from '../../modals/editUserInfo/checkingPassword';
import EditUserInfo from '../../modals/editUserInfo/editUserInfo';
import Withdrawal from '../../modals/editUserInfo/withdrawal';
import axios from 'axios';
import { persistor } from '../../index';

function Nav() {
  const [isOpen, SetOpen] = useState(false);
  const navigate = useNavigate();
  const modalLogin = useSelector(
    (state: RootState) => state.modalReducer.isLoginModal, // test중입니다.
  ); // 로그인 모달창
  const modalSignup = useSelector(
    (state: RootState) => state.modalReducer.isSigninModal,
  ); // 회원가입 모달창
  const userinfo = useSelector(
    (state: RootState) => state.setUserInfoReducer.userInfo,
  ); // 유저의 정보
  const state = useSelector((state: RootState) => state.modalReducer);
  const modalCheckPassword = state.isCheckingPasswordModal; // 회원정보 수정하기 전 비밀번호 확인 모달창
  const modalEditUserInfo = state.isEditUserInfoModal; // 회원정보 수정 모달창
  const modalWithdrawal = state.iswithdrawalModal; // 회원탈퇴 모달창
  const dispatch = useDispatch();

  // 로그인,로그아웃 버튼 클릭시 작동하는 함수
  const loginButtonHandler = () => {
    if (userinfo.isLogin) {
      // 로그아웃 API
      axios.get(`${url}/users/auth`, { withCredentials: true }).then((res) => {
        if (res.status === 200) {
          // window.localStorage.clear(); // 로컬 스토리지를 비우고
          persistor.purge();
          window.location.reload(); // 새로고침
          // const url2 = 'http://localhost:3000';
          const url2 = 'https://memory-road.net';
          window.location.assign(`${url2}`); // home으로 이동
        }
      });
    } else {
      dispatch(loginModal(true)); // 로그인 버튼을 누르면 로그인 모달창이 나옴
    }
  };
  const isvalid = (email: string, username: string, password: string) => {
    const character = /^[ A-Za-z0-9_@./#&+-]*$/; // 영문,숫자,특정 특수문자만 허용
    const regexpassword = /[0-9a-zA-Z.;\-]/;
    if (
      character.test(email) &&
      5 <= email.length &&
      !email.includes(' ') &&
      email.includes('@')
    ) {
      return 'Email'; // 이메일은 영문,숫자,특정 특수문자만 허용, 5글자 이상, 공백이 있으면 안되고, @를 포함해야함
    }
    if (!username.includes(' ') && username.length >= 2) {
      return 'Username'; // 닉네임은 공백을 포함해서는 안되고 2글자 이상
    }
    if (8 <= password.length && regexpassword.test(password)) {
      return 'Password'; // 비밀번호는 8자 이상이어야하고 영문,숫자,특수문자를 포함
    } else {
      return false;
    }
  };

  // 스크롤 이벤트
  let beforeScrollBar = document.documentElement.scrollTop;
  let isScrollDown = true;
  window.onwheel = function (e) {
    const currentScrollBar = document.documentElement.scrollTop;
    const nav = document.querySelector('.nav-gridContainer');
    // console.log(nav);
    if (currentScrollBar > 70) {
      if (beforeScrollBar < currentScrollBar) {
        // 스크롤 아래로
        isScrollDown = true;
      } else {
        // 스크롤 위로
        isScrollDown = false;
      }
    } else {
    }
    beforeScrollBar = currentScrollBar;

    if (isScrollDown && currentScrollBar > 50) {
      nav?.classList.add('nav-RemoveGridContainer'); // nav바 지움
    }
    if (currentScrollBar <= 50) {
      nav?.classList.remove('nav-RemoveGridContainer'); // nav바가 나옴
    }
    if (!isScrollDown) {
      nav?.classList.remove('nav-RemoveGridContainer'); // nav바가 나옴
    }
  };
  const url = 'https://server.memory-road.net';
  // const url = 'http://localhost';
  return (
    <div>
      {modalLogin ? <LoginModal url={url} /> : null}
      {modalSignup ? <SignUp isvalid={isvalid} url={url} /> : null}
      {modalCheckPassword ? <CheckingPassword url={url} /> : null}
      {modalEditUserInfo ? <EditUserInfo isvalid={isvalid} url={url} /> : null}
      {modalWithdrawal ? <Withdrawal url={url} /> : null}
      <div className="nav-gridContainer-fix-fix">
        <div className="nav-gridContainer">
          <div
            className="nav-item"
            onClick={() => navigate('/')}
            onKeyDown={() => navigate('/')}
            role="menu"
            tabIndex={0}
          >
            <img
              alt="Logo"
              className="nav-logo"
              src="https://server.memory-road.net/upload/LOGO.png"
            />
          </div>
          <div></div>

          <div
            className={userinfo.isLogin ? 'nav-loginfont' : ''}
            onClick={() => {
              if (userinfo.isLogin) {
                navigate('/Mypage');
              }
            }}
            onKeyDown={() => navigate('/Mypage')}
            role="menu"
            tabIndex={0}
          >
            {userinfo.isLogin ? '마이페이지' : null}
          </div>

          <div
            className="nav-loginfont"
            onClick={() => {
              if (userinfo.isLogin) {
                // navigate('/');
                // window.localStorage.clear(); // 로컬 스토리지를 비우고
                // window.location.reload(); // 새로고침
                // persistor.purge(); // 로그아웃 누르면 상태가 안바뀜 , 다시 새로고침 하면 상태가 로그아웃 상태가됨
                // dispatch(setUserInfo(false, null, null, null, null, null));
                // persist purge를 이용?
                loginButtonHandler();
              } else {
                dispatch(loginModal(true));
              }
            }}
            onKeyDown={() => {
              if (userinfo.isLogin) {
                loginButtonHandler();
              } else {
                dispatch(loginModal(true));
              }
            }}
            role="menu"
            tabIndex={0}
          >
            {userinfo.isLogin ? '로그아웃' : '로그인'}
          </div>
          {/* 메뉴창 */}
          <div className="nav-mobile">
            <div> {isOpen ? <OpenedMenu SetOpen={SetOpen} /> : null}</div>
            <i
              className="fas fa-bars"
              onClick={() => {
                SetOpen(!isOpen);
              }}
              onKeyDown={() => {
                SetOpen(!isOpen);
              }}
              role="menu"
              tabIndex={0}
            ></i>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Nav;
