import React from 'react';
import './Signup.css';
import { useState } from 'react';
import { useDispatch, batch } from 'react-redux';
import axios from 'axios';
import Mist from '../../components/mist';
import { loginModal, signupModal } from '../../redux/actions/index';

function SignUp({ isvalid, url }: any) {
  const dispatch = useDispatch();
  const [Emailchecking, setEmailChecking] = useState(false); // 이메일 중복확인을 눌러서 사용가능하면 true로 바뀜
  const [errorMessage, setErrorMessage] = useState(''); // 회원가입 버튼 아래에 나오는 에러메시지
  const [successMessage, setsuccessMessage] = useState('');
  // 이메일 중복확인 API요청
  const emailChecking = () => {
    if (isvalid(Email, '', '') !== 'Email') {
      setsuccessMessage('');
      setErrorMessage('사용할 수 없는 이메일 입니다.');
    } else {
      axios
        .post(`${url}/users/auth/local/email`, { email: Email })
        .then((res) => {
          if (res.status === 200) {
            setErrorMessage('');
            setsuccessMessage('사용 가능한 이메일 입니다.');
            setEmailChecking(true);
          }
        })
        .catch((error) => {
          setErrorMessage('이미 사용하고 있는 이메일 입니다.');
          setsuccessMessage('');
          setEmailChecking(false);
        });
    }
  };

  // 회원가입 API요청(회원가입 버튼에 작동됨)
  const signup = () => {
    // 데이터베이스에 유저를 저장
    if (
      isvalid(Email, '', '') &&
      isvalid('', username, '') &&
      isvalid('', '', Password) &&
      Password === checkingPassword
    ) {
      if (!Emailchecking) {
        setErrorMessage('이메일 중복확인을 해주세요');
        setsuccessMessage('');
      } else {
        axios
          .post(`${url}/users`, {
            email: Email,
            password: Password,
            nickName: username,
          })
          .then((res) => {
            if (res.status === 201) {
              // 성공적으로 회원가입이 완료되면
              dispatch(signupModal(false)); // 회원가입 모달창을 닫고
              dispatch(loginModal(true)); // 로그인 모달창을 연다
            }
          })
          .catch((error) => {
            if (Emailchecking) {
              setErrorMessage('중복된 닉네임 입니다.');
              setsuccessMessage('');
            } else {
              setsuccessMessage('');
            }
          });
      }
    } else {
      setErrorMessage('모든 항목을 작성해주세요');
      setsuccessMessage('');
    }
  };

  // 회원가입시 이메일
  const [Email, setEmail] = useState('');
  const InputEmail = (e: any) => {
    setEmail(e.target.value);
  };
  // 회원가입시 닉네임
  const [username, setUsername] = useState('');
  const InputUsername = (e: any) => {
    setUsername(e.target.value);
  };
  // 회원가입시 비밀번호
  const [Password, setPassword] = useState('');
  const InputPassword = (e: any) => {
    setPassword(e.target.value);
  };
  // 회원가입시 비밀번호 확인
  const [checkingPassword, setCheckingPassword] = useState('');
  const InputCheckingPassword = (e: any) => {
    setCheckingPassword(e.target.value);
  };

  return (
    <div>
      <div
        className="signup-modal-align-center-fix"
        onClick={(e) => {
          if (e.target !== e.currentTarget) return;
          dispatch(signupModal(false));
        }}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          dispatch(signupModal(false));
        }}
        role="menu"
        tabIndex={0}
      >
        <div className="signup-SignUpBorder">
          <div className="signup-center signup-titleSignup">회원가입</div>
          <div className="signup-center-fix-fix-fix">
            <div className="signup-textOninput">이메일</div>
            <input
              className="signup-input2"
              maxLength={24}
              onChange={(e) => {
                InputEmail(e);
                setEmailChecking(false);
              }}
              placeholder="이메일을 입력해주세요."
              type="text"
            ></input>
            <button className="signup-Emailcheck" onClick={emailChecking}>
              이메일 중복확인
            </button>
            <div
              className="signup-ErrorMessage2"
              style={{ marginBottom: '30px' }}
            >
              {isvalid(Email, '', '') === 'Email'
                ? null
                : '5자이상 영문,숫자,특수기호만 사용가능합니다'}
            </div>
            <div className="signup-textOninput">닉네임</div>
            <input
              className="signup-input2"
              maxLength={10}
              onChange={InputUsername}
              placeholder="닉네임을 입력해주세요."
              type="text"
            ></input>
            <div
              className="signup-ErrorMessage2"
              style={{ marginBottom: '30px' }}
            >
              {isvalid('', username, '') === 'Username'
                ? null
                : '2자 이상, 공백이 들어갈 수 없습니다'}
            </div>
            <div className="signup-textOninput">비밀번호</div>
            <input
              className="signup-input2"
              maxLength={16}
              onChange={InputPassword}
              placeholder="비밀번호를 입력해주세요."
              type="password"
            ></input>
            <div className="signup-ErrorMessage2">
              {isvalid('', '', Password) === 'Password'
                ? null
                : '8~16자의 영문,숫자,특수문자를 사용하세요'}
            </div>
            <input
              className="signup-input2"
              maxLength={16}
              onChange={InputCheckingPassword}
              placeholder="비밀번호을 다시 한번 입력해주세요."
              type="password"
            ></input>
            <div
              className="signup-ErrorMessage2"
              style={{ marginBottom: '15px' }}
            >
              {Password === checkingPassword
                ? null
                : '비밀번호가 일치하지 않습니다.'}
            </div>
            <div className="signup-ErrorMessage2 signup-center2">
              {errorMessage}
              <div className="signup-successMessage">{successMessage}</div>
            </div>
            <div className="signup-center">
              <button
                className="signup-SignUpButton signup-pointer"
                onClick={signup}
              >
                회원가입
              </button>
            </div>
          </div>
          <div className="signup-ToLogin">
            혹시 회원이신가요?{' '}
            <b
              className="signup-pointer"
              onClick={() => {
                dispatch(signupModal(false)); // 회원가입 모달창을 닫고
                dispatch(loginModal(true)); // 로그인 모달창을 연다
              }}
              onKeyDown={() => {
                dispatch(signupModal(false));
                dispatch(loginModal(true));
              }}
              role="menu"
              tabIndex={0}
            >
              로그인
            </b>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
