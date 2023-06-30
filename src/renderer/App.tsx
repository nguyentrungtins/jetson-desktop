import { useEffect, useRef, useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import io, { Socket } from 'socket.io-client';
import moment from 'moment-timezone';
import { startStreaming, getSecurityMode } from '../utils/appHelper';
import { IDailySecurityMode, IUserCheckinData } from './types';
import getConfigs from '../api/configs';
import icon from '../../assets/logo_icon.svg';
import scanFrame from '../../assets/scan_frame.svg';
import doorIcon from '../../assets/door_icon.svg';
import reportIcon from '../../assets/report_icon.svg';
import PinCode from '../components/PinCode';

const MODE_NONE = 0;
const MODE_PIN = 1;
const MODE_DOOR = 2;
const TIME_SHOW_USER = 15000;
const SOCKET_URL = 'http://localhost:3000';
function Welcome() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [configData, setConfigData] = useState<IDailySecurityMode[]>([]);
  const [securityMode, setSecurityMode] = useState<number | undefined>();
  const videoRef = useRef<HTMLVideoElement>(null);
  // Show user or not
  const [userItemDisplay, setUserItemDisplay] = useState<boolean>(false);
  // Show PinKeyboard or not
  const [showPinCode, setShowPinCode] = useState<boolean>(false);
  // Update User Check-in State when a user check-face
  const [isUserCheckIn, setIsUserCheckIn] = useState<boolean>();
  const [userCheckInData, setUserCheckInData] = useState<IUserCheckinData>();
  // User Check-in Data
  const [userImg, setUserImg] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userMail, setUserMail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  // For display realtime current Time & Date
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');

  // Check User PinCode Valid on MODE_PIN & MODE_DOOR
  const [isUserTypeCorrectPinCode, setIsUserTypeCorrectPinCode] =
    useState<boolean>();

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);
  // Update Time & Date for showing on the top
  const updateDate = () => {
    const date = moment().format('ddd, MMM D, YYYY');
    const time = moment().format('h:mm:ss');
    setCurrentDate(date);
    setCurrentTime(time);
  };

  // Update current time and date
  setTimeout(updateDate, 1000);

  // Button Door Clicked
  const clickOpenDoorHandler = () => {
    setShowPinCode(!showPinCode);
  };
  // For debug
  const showState = () => {
    console.log('userCheckIn', isUserCheckIn);
    console.log('userCheckInData', userCheckInData);
    console.log('securityMode', securityMode);
    console.log('userItemDisplay', userItemDisplay);
    console.log('configData: ', configData);
  };

  // Check is PINCODE is OK from child components PinCode
  const isPinCodeValid = (isValid: boolean) => {
    if (isValid) setIsUserTypeCorrectPinCode(true);
  };
  // Clear data after do all the check
  const turnOffShowUserAndResetUserCheckInData = () => {
    setUserItemDisplay(false);
    setIsUserCheckIn(false);
    setUserCheckInData(undefined);
    setShowPinCode(false);
  };

  const turnOffPinCodeWhenUserHitCancel = (isCancel: boolean) => {
    if (isCancel) {
      setUserItemDisplay(false);
      turnOffShowUserAndResetUserCheckInData();
    }
  };
  // Emit the socket to server to open the door
  const openDoor = () => {
    if (socket) {
      socket.emit('doorOpen', 'jetson');
      socket.emit('homeMessage', 'jetson');
    }
  };
  // Show user when receive socket user check-face
  const setDataForUserItem = (data: IUserCheckinData) => {
    const { userId: ID, userName: NAME, image: IMAGE } = data;
    setUserImg(IMAGE);
    setUserName(NAME);
    setUserMail(`${ID}@cyberlogitec.com`);
    setUserId(ID);
    setUserItemDisplay(true);
  };
  const showUser = (data: IUserCheckinData, mode: number) => {
    setDataForUserItem(data);
    if (mode === MODE_NONE || mode === MODE_DOOR) {
      openDoor();
      setTimeout(() => {
        setUserItemDisplay(false);
        setIsUserCheckIn(false);
      }, TIME_SHOW_USER);
    }
  };

  const handleWhenUserCheckIn = () => {
    if (userCheckInData && isUserCheckIn) {
      if (configData) {
        setSecurityMode(getSecurityMode(configData));
      }
      if (securityMode !== undefined) {
        if (securityMode !== MODE_PIN) {
          showUser(userCheckInData, securityMode);
        }
        if (securityMode === MODE_PIN && showPinCode === false) {
          showUser(userCheckInData, securityMode);
          setShowPinCode(true);
        }
      }
    }
  };

  // Check if user type correct PIN CODE for Security Mode PIN & DOOR
  // and if does then open the door and clear data
  const handleWhenUserTypeCorrectPinCode = () => {
    if (isUserTypeCorrectPinCode) {
      turnOffShowUserAndResetUserCheckInData();
      openDoor();
      setIsUserTypeCorrectPinCode(false);
      setShowPinCode(false);
    }
  };

  const fetchInitialConfigFromServerForTheFirstTime = () => {
    const getInitialConfigs = async () => {
      const initialConfigs = await getConfigs();
      setConfigData(initialConfigs);
      setSecurityMode(getSecurityMode(initialConfigs));
    };
    getInitialConfigs();
  };
  const init = () => {
    fetchInitialConfigFromServerForTheFirstTime();
    startStreaming(videoRef);
  };

  useEffect(() => {
    handleWhenUserCheckIn();
  }, [isUserCheckIn, userCheckInData, showPinCode]);

  useEffect(() => {
    handleWhenUserTypeCorrectPinCode();
  }, [isUserTypeCorrectPinCode]);

  // Fetch config data and stream camera for the first time access the app
  useEffect(() => {
    init();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('connect', () => {
        console.log('Connected to server');
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from server');
        setTimeout(() => {
          socket.connect();
        }, 5000); // Attempt to reconnect after 5 seconds
      });

      socket.on('reconnect', () => {
        console.log('Reconnected to server');
      });

      socket.on('reconnect_error', () => {
        console.log('Failed to reconnect to server');
      });
      socket.on('checkFace', (data: IUserCheckinData) => {
        setIsUserCheckIn(true);
        setUserCheckInData(data);
      });
      socket.on('reloadWelcome', async () => {
        const newConfigs = await getConfigs();
        setConfigData(newConfigs);
        setSecurityMode(getSecurityMode(newConfigs));
      });
    }
  }, [socket]);

  return (
    <main>
      <button type="button" className="showState" onClick={showState}>
        Log State
      </button>
      <div className="header-wrapper">
        <div className="left-header">
          <img className="logo" src={icon} alt="icon-app" />
          <h1 id="date" className="date">
            {currentDate}
          </h1>
        </div>

        <div className="right-header">
          <h1 id="time" className="time">
            {currentTime}
          </h1>
        </div>
      </div>

      <div className="camera-wrapper">
        <div className="camera-display">
          <video
            ref={videoRef}
            id="video"
            className="video-camera"
            playsInline
            autoPlay
          />
          <canvas />
          <div className="c-scan">
            <img className="scan-frame" src={scanFrame} alt="scan img" />
          </div>

          {userItemDisplay && (
            <div id="user-item" className="users-item">
              <div className="card">
                <div className="image-card">
                  <div className="image-wrapper">
                    <img
                      src={userImg}
                      id="user-img"
                      alt=""
                      className="user-img"
                    />
                  </div>
                </div>
                <div className="info-card">
                  <span id="user-name" className="name">
                    {userName}
                  </span>
                  <span id="user-email" className="email">
                    {userMail}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="footer-wrapper">
        {securityMode === MODE_DOOR && (
          <>
            <img
              src={doorIcon}
              alt="door"
              className="btn-openDoor"
              onClick={clickOpenDoorHandler}
            />
            <img src={reportIcon} alt="report" className="btn-report" />
          </>
        )}
      </div>
      {showPinCode && (
        <PinCode
          userId={securityMode === MODE_DOOR ? null : userId}
          isPinCodeValid={isPinCodeValid}
          turnOffPinCode={turnOffPinCodeWhenUserHitCancel}
        />
      )}
    </main>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
      </Routes>
    </Router>
  );
}
