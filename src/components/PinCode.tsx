import { useState } from 'react';
import styles from './PinCode.module.css';
import { PinItem } from './PinItem';
import { sha256 } from 'js-sha256';
const PIN_ARRAY = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, -1];
import { checkPinCode } from 'api/pinCode';
export function PinCode({
  userId,
  isPinCodeValid,
}: {
  userId: string;
  isPinCodeValid: any;
}) {
  const [pinUserTyping, setPinUserTyping] = useState<number[]>([]);
  const onClickNumber = (num: number) => {
    if (num == -1) {
      const popPinUserTyping = pinUserTyping.slice(0, -1);
      setPinUserTyping(popPinUserTyping);
    } else {
      setPinUserTyping([...pinUserTyping, num]);
    }
  };
  const okClickHandler = async () => {
    setPinUserTyping([]);
    const pinCodeHash = sha256(pinUserTyping.join(''));
    const isUserPinCodeCheckOK = await checkPinCode(userId, pinCodeHash);
    console.log(isUserPinCodeCheckOK);
    if (isUserPinCodeCheckOK) {
      isPinCodeValid(true);
    }
  };
  const cancelClickHandler = () => {
    setPinUserTyping([]);
  };
  console.log(pinUserTyping);

  return (
    <div className={styles.wrapper}>
      <div className={styles.gridContainer}>
        <div className={styles.gridBody}>
          <ul className={styles.pinTypeDisplay}>
            {pinUserTyping.map((_, index) => (
              <li key={index}>&#x2022; </li>
            ))}
          </ul>
          <div className={styles.gridWrapper}>
            {PIN_ARRAY.map((pinValue, index) => (
              <div className={styles.gridItem}>
                <PinItem key={index} item={pinValue} onClick={onClickNumber} />
              </div>
            ))}
          </div>
          <div className={styles.btnGroup}>
            <button className={styles.btnCancel} onClick={cancelClickHandler}>
              Cancel
            </button>
            <button className={styles.btnOK} onClick={okClickHandler}>
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
