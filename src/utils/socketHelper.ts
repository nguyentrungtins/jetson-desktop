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
