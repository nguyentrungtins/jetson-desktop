import { useEffect, useRef, useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import io from 'socket.io-client';
import { IConfig, ISecurityMode, IUserCheckinData } from './types';
import { getConfigs } from '../api/configs';
import icon from '../../assets/logo_icon.svg';
import scanFrame from '../../assets/scan_frame.svg';
import doorIcon from '../../assets/door_icon.svg';
import reportIcon from '../../assets/report_icon.svg';
import moment from 'moment-timezone';
import { PinCode } from '../components/PinCode';

const MODE_NONE = 0;
const MODE_PIN = 1;
const MODE_DOOR = 2;
const TIME_SHOW_USER = 15000;
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

  console.log(isUserTypeCorrectPinCode);
  const socket = io('http://localhost:3000');
  const isPinCodeValid = (isValid: boolean) => {
    setIsUserTypeCorrectPinCode(isValid);
  };
  const showUser = (data: IUserCheckinData, mode: number) => {
    console.log('Mode: ', mode);
    setUserItemDisplay(true);
    const { userId: ID, userName: NAME, image: IMAGE } = data;
    setUserImg(IMAGE);
    setUserName(NAME);
    setUserMail(`${ID}@cyberlogitec.com`);
    setUserId(ID);
    if (mode == MODE_NONE) {
      console.log('run in 1');
      setTimeout(() => {
        setUserItemDisplay(false);
      }, TIME_SHOW_USER);
    } else {
      console.log('run in 2');
      if (isUserTypeCorrectPinCode) {
        console.log('run in 3');
        setUserItemDisplay(false);
      }
    }
  };
  const openDoor = (mode: number, isPinCodeValid: boolean) => {
    if (mode == MODE_NONE) {
      socket.emit('doorOpen', 'jetson');
      socket.emit('homeMessage', 'jetson');
    } else if (isPinCodeValid) {
      socket.emit('dooropen', 'jetson');
      socket.emit('homemessage', 'jetson');
    }
  };
  const startStreaming = async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((d) => d.kind === 'videoinput');
    const cameraClone = videoDevices.pop();
    // console.log(cameraClone);
    const mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        deviceId: { exact: cameraClone?.deviceId },
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
  const getCurrentDayTime = () => {
    let dayOfWeekNumber: number = (moment().day() || 7) + 1; // returns a number from 2 to 8
    if (dayOfWeekNumber === 9) dayOfWeekNumber = 1; // adjust Sunday to 8
    const currentTime = moment().format('HH:mm');
    return { dayOfWeekNumber, currentTime };
  };
  const checkSecurityMode = (configs: ISecurityMode[]) => {
    const { dayOfWeekNumber: currentDayNumber, currentTime } =
      getCurrentDayTime();
    configs.forEach((day: ISecurityMode) => {
      if (+day.weekday == currentDayNumber) {
        const isInRange = checkIsInRangeOfTimes(
          day.start,
          day.end,
          currentTime
        );
        if (isInRange) {
          setSecurityMode(+day.mode);
          return;
        }
      }
    });
  };
  const updateDate = () => {
    const date = moment().format('ddd, MMM D, YYYY');
    const time = moment().format('h:mm A');
    setCurrentDate(date);
    setCurrentTime(time);
  };

  // Receive socket when user check face
  useEffect(() => {
    socket.on('checkFace', (data: IUserCheckinData) => {
      setIsUserCheckIn(true);
      setUserCheckInData(data)
      // // check security mode
      // checkSecurityMode(configData);
      // if (securityMode) {
      //   showUser(data, securityMode);
      //   openDoor(securityMode, isUserTypeCorrectPinCode);
      // }
    });
  }, []);

  useEffect(() => {
    checkSecurityMode(configData);
  }, [configData]);

  useEffect(() => {
    if (isUserCheckIn != undefined && isUserCheckIn && securityMode != undefined) {
      if (userCheckInData != undefined) {
        showUser(userCheckInData, securityMode);
        // openDoor(securityMode, isUserTypeCorrectPinCode);
      }
    }
  }, [isUserCheckIn, userCheckInData]);

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
  }, [configData]);

  // Update current time and date
  setInterval(updateDate, 1000);

  const clickOpenDoorHandler = (e: EventTarget) => {
    console.log(e);
  };

  return (
    <main>
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
      {userItemDisplay && securityMode != MODE_NONE && (
        <PinCode userId={userId} isPinCodeValid={isPinCodeValid} />
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