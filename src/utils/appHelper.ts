import moment from 'moment-timezone';
import { RefObject } from 'react';
import { IDailySecurityMode, ISecurityMode } from 'renderer/types';

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
const getSecurityMode = (configs: IDailySecurityMode[]) => {
  const { dayOfWeekNumber: currentDayNumber, currentTimeCheck } =
    getCurrentDayTime();
  let mode = 0;
  configs.forEach((day: IDailySecurityMode) => {
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
  return mode;
};

const startStreaming = async (videoRef: RefObject<HTMLVideoElement>) => {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const videoDevices = devices.filter((d) => d.kind === 'videoinput');
  const cameraClone = videoDevices.pop();
  // Get the screen width and height
  let screenWidth = null;
  let screenHeight = null;
  try {
    screenWidth = screen.width;
    screenHeight = screen.height;
  } catch (error) {
    console.log(error);
  }
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
export {
  checkIsInRangeOfTimes,
  getCurrentDayTime,
  getSecurityMode,
  startStreaming,
};
