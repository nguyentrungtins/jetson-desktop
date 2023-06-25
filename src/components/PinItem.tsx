// import { useEffect, useRef, useState } from 'react';
const EMPTY_PIN_ITEM = -1;
const BACKSPACE = 'BACKSPACE';
import styles from './PinItem.module.css';
export function PinItem({
  item,
  onClick,
}: {
  item: number;
  onClick: (num: number) => void;
}) {
  return (
    <div className={styles.wrapper} onClick={() => onClick(item)}>
      {item != -1 ? <p>{item.toString()}</p> : <p>&#8617;</p>}
    </div>
  );
}
