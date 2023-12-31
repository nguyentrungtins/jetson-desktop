import { useEffect, useState } from 'react';
import { sha256 } from 'js-sha256';
import checkPinCode from 'api/pinCode';
import styles from './PinCode.module.css';
import PinItem from './PinItem';

const PIN_ARRAY = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, -1];
export default function PinCode({
  userId,
  isPinCodeValid,
  turnOffPinCode,
}: {
  userId: string | null;
  isPinCodeValid: any;
  turnOffPinCode: any;
}) {
  const [pinUserTyping, setPinUserTyping] = useState<number[]>([]);
  const [countUserTypeIncorrectPIN, setCountUserTypeIncorrectPIN] =
    useState<number>(0);

  const [countDownTimer, setCountDownTimer] = useState<number>(30);
  useEffect(() => {
    const timer = setTimeout(() => {
      setPinUserTyping([]);
      turnOffPinCode(true);
    }, 30000);
    return () => clearTimeout(timer);
  }, []);

  const onClickNumberHandler = (num: number) => {
    if (num === -1) {
      const popPinUserTyping = pinUserTyping.slice(0, -1);
      setPinUserTyping(popPinUserTyping);
    } else {
      setPinUserTyping([...pinUserTyping, num]);
    }
  };
  const okClickHandler = async () => {
    const pinCodeHash = sha256(pinUserTyping.join(''));
    const isUserPinCodeCheckOK = await checkPinCode(userId, pinCodeHash);
    // console.log(isUserPinCodeCheckOK);
    setPinUserTyping([]);
    if (isUserPinCodeCheckOK) {
      isPinCodeValid(true);
    } else {
      setCountUserTypeIncorrectPIN(countUserTypeIncorrectPIN + 1);
      if (countUserTypeIncorrectPIN === 2) {
        console.log('Type Incorrect Pin reach limied');
      }
    }
  };
  useEffect(() => {
    if (pinUserTyping.length === 6) {
      okClickHandler();
    }
  }, [pinUserTyping]);
  const cancelClickHandler = () => {
    setPinUserTyping([]);
    turnOffPinCode(true);
  };

  setTimeout(() => {
    setCountDownTimer(countDownTimer - 1);
  }, 1000);

  return (
    <div className={styles.wrapper}>
      <div className={styles.gridContainer}>
        <div className={styles.gridBody}>
          <div className={styles.countDownTimer}>{countDownTimer}s</div>
          <ul className={styles.pinTypeDisplay}>
            {pinUserTyping.map((_, index) => (
              <li key={index}>&#x2022; </li>
            ))}
          </ul>
          <div className={styles.gridWrapper}>
            {PIN_ARRAY.map((pinValue, index) => (
              <div key={index} className={styles.gridItem}>
                <PinItem item={pinValue} onClick={onClickNumberHandler} />
              </div>
            ))}
          </div>
          <div className={styles.btnGroup}>
            <button
              type="button"
              className={styles.btnCancel}
              onClick={cancelClickHandler}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.btnOK}
              onClick={okClickHandler}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
