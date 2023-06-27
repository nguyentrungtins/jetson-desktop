import styles from './PinItem.module.css';
const BACKSPACE = -1;

export default function PinItem({
  item,
  onClick,
}: {
  item: number;
  onClick: (num: number) => void;
}) {
  return (
    <button
      type="button"
      className={styles.wrapper}
      onClick={() => onClick(item)}
    >
      {item !== BACKSPACE ? <p>{item.toString()}</p> : <p>&#8617;</p>}
    </button>
  );
}
