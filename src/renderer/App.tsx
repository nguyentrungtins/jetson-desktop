import { useEffect, useRef, useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import io from 'socket.io-client';
import moment from 'moment-timezone';
import { IConfig, ISecurityMode, IUserCheckinData } from './types';
import { getConfigs } from '../api/configs';
import icon from '../../assets/logo_icon.svg';
import scanFrame from '../../assets/scan_frame.svg';
import doorIcon from '../../assets/door_icon.svg';
import reportIcon from '../../assets/report_icon.svg';
import PinCode from '../components/PinCode';

const MODE_NONE = 0;
const MODE_PIN = 1;
const MODE_DOOR = 2;
const TIME_SHOW_USER = 5000;
function Welcome() {
  const [configData, setConfigData] = useState<ISecurityMode[]>([]);
  const [securityMode, setSecurityMode] = useState<number | undefined>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [userItemDisplay, setUserItemDisplay] = useState<boolean>(false);
  const [isUserCheckIn, setIsUserCheckIn] = useState<boolean>();
  const [userCheckInData, setUserCheckInData] = useState<IUserCheckinData>();
  const [userImg, setUserImg] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [userMail, setUserMail] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isUserTypeCorrectPinCode, setIsUserTypeCorrectPinCode] =
    useState<boolean>();

  const socket = io('http://localhost:3000');

  // Check is PINCODE is OK from child components PinCode
  const isPinCodeValid = (isValid: boolean) => {
    console.log('from app:', isValid);
    if (isValid) {
      setIsUserTypeCorrectPinCode(true);
    }
  };
  // Clear data after do all the check
  const turnOffShowUserAndResetUserCheckInData = () => {
    setUserItemDisplay(false);
    setIsUserCheckIn(false);
    setUserCheckInData(undefined);
  };

  const turnOffPinCode = (isCancel: boolean) => {
    if (isCancel) {
      setUserItemDisplay(false);
      turnOffShowUserAndResetUserCheckInData();
    }
  };
  // Emit the socket to server to open the door
  const openDoor = () => {
    socket.emit('doorOpen', 'jetson');
    socket.emit('homeMessage', 'jetson');
  };
  // Show user when receive socket user check-face
  const showUser = (data: IUserCheckinData, mode: number) => {
    setUserItemDisplay(true);
    const { userId: ID, userName: NAME, image: IMAGE } = data;
    setUserImg(IMAGE);
    setUserName(NAME);
    setUserMail(`${ID}@cyberlogitec.com`);
    setUserId(ID);
    if (mode === MODE_NONE) {
      openDoor();
      setTimeout(() => {
        setUserItemDisplay(false);
        setIsUserCheckIn(false);
      }, TIME_SHOW_USER);
    }
  };
  const startStreaming = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === 'videoinput');
    const cameraClone = videoDevices.pop();
    // console.log(cameraClone);
    // Get the screen width and height
    let screenWidth = null;
    let screenHeight = null;
    try {
      screenWidth = screen.width;
      screenHeight = screen.height;
    } catch (error) {
      console.log(error);
    }
    // console.log(screenWidth);
    // console.log(screenHeight);
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: { exact: cameraClone?.deviceId },
        // Change the video input device based on the screen dimensions
        width: screenWidth ? screenWidth : 1080,
        height: screenHeight ? screenHeight : 1920,
      },
    });
    if (videoRef.current) {
      videoRef.current!.srcObject = mediaStream;
      await videoRef.current.play();
    }
  };
  const checkIsInRangeOfTimes = (
    startTime: string,
    endTime: string,
    timeToCheck: string
  ) => {
    // Parse the start, end, and check times into moment objects
    const startMoment = moment(startTime, 'HH:mm');
    const endMoment = moment(endTime, 'HH:mm');
    const checkMoment = moment(timeToCheck, 'HH:mm');

    // Check if the check time is within the start and end time range
    const isInRange = checkMoment.isBetween(startMoment, endMoment);

    return isInRange;
  };
  // Get current day and time
  const getCurrentDayTime = () => {
    let dayOfWeekNumber: number = (moment().day() || 7) + 1; // returns a number from 2 to 8
    if (dayOfWeekNumber === 9) dayOfWeekNumber = 1; // adjust Sunday to 8
    const currentTimeCheck = moment().format('HH:mm');
    return { dayOfWeekNumber, currentTimeCheck };
  };

  // Check Security Mode
  const checkSecurityMode = (configs: ISecurityMode[]) => {
    const { dayOfWeekNumber: currentDayNumber, currentTimeCheck } =
      getCurrentDayTime();
    let mode = 0;
    configs.forEach((day: ISecurityMode) => {
      if (+day.weekday === currentDayNumber) {
        const isInRange = checkIsInRangeOfTimes(
          day.start,
          day.end,
          currentTimeCheck
        );
        if (isInRange) {
          // setSecurityMode(+day.mode);
          mode = +day.mode;
        }
      }
    });
    setSecurityMode(mode);
  };
  // Update Time & Date for showing on the top
  const updateDate = () => {
    const date = moment().format('ddd, MMM D, YYYY');
    const time = moment().format('h:mm A');
    setCurrentDate(date);
    setCurrentTime(time);
  };

  // Receive socket when user check face
  useEffect(() => {
    socket.on('checkFace', (data: IUserCheckinData) => {
      console.log('user-check-in');
      setIsUserCheckIn(true);
      setUserCheckInData(data);
    });
    // Clean up socket event listeners
    return () => {
      socket.off('checkFace');
    };
  }, []);

  //Check user checkin and show user by security mode
  useEffect(() => {
    // console.log('user check-in: ', isUserCheckIn);
    if (userCheckInData && isUserCheckIn) {
      if (configData) {
        checkSecurityMode(configData);
      }
      if (securityMode) {
        showUser(userCheckInData, securityMode);
      }
    }
  }, [isUserCheckIn]);

  // Check if user type correct PIN CODE for Security Mode PIN & DOOR
  // and if does then open the door and clear data
  useEffect(() => {
    // console.log('user check-in: ', isUserCheckIn);
    if (isUserTypeCorrectPinCode) {
      turnOffShowUserAndResetUserCheckInData();
      openDoor();
      setIsUserTypeCorrectPinCode(false);
    }
  }, [isUserTypeCorrectPinCode]);

  // Fetch configs in the first time access the page
  useEffect(() => {
    let initialConfigs = configData;
    const getInitialConfigs = async () => {
      initialConfigs = await getConfigs();
      setConfigData(initialConfigs);
      checkSecurityMode(initialConfigs);
    };
    getInitialConfigs();
    startStreaming();
  }, []);

  // Receive socket every time client changed config
  useEffect(() => {
    socket.on('reloadWelcome', async () => {
      const newConfigs = await getConfigs();
      setConfigData(newConfigs);
      checkSecurityMode(newConfigs);
    });
    return () => {
      socket.off('reloadWelcome');
    };
  }, []);

  // Update current time and date
  setInterval(updateDate, 1000);

  const clickOpenDoorHandler = (e: EventTarget) => {
    console.log(e);
  };
  // For debug
  const showState = () => {
    console.log('userCheckIn', isUserCheckIn);
    console.log('userCheckInData', userCheckInData);
    console.log('securityMode', securityMode);
    console.log('userItemDisplay', userItemDisplay);
  };

  return (
    <main>
      <button className="showState" onClick={showState}>
        State
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
        {securityMode !== MODE_NONE && (
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
      {userItemDisplay && securityMode !== MODE_NONE && (
        <PinCode
          userId={userId}
          isPinCodeValid={isPinCodeValid}
          turnOffPinCode={turnOffPinCode}
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
