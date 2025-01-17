import React, { useCallback } from "react";
import { useMeasure } from "react-use";
import useStore from "store";

const Chart = ({ productId, isPositive }) => {
  const [ref, { width, height }] = useMeasure();
  const candles = useStore(
    useCallback((state) => state.candles[productId]?.candles, [productId])
  );

  if (!candles?.length) return <div></div>;

  const candleWidth = width / candles.length;

  const min = Math.min(...candles.map((c) => c[4]));
  const max = Math.max(...candles.map((c) => c[4]));

  const getY = (y) => {
    return height - ((y - min) / (max - min)) * height;
  };

  const getX = (x) => width - x;

  const points = candles
    .map((candle, i) => `${getX(i * candleWidth)}, ${getY(candle[4])}`)
    .join(" ");

  return (
    <div className={"h-24"}>
      <div ref={ref} className={`w-full h-full`}>
        {width && height && (
          <svg viewBox={`0 0 ${width} ${height}`}>
            <polyline
              fill={"none"}
              stroke={isPositive ? "rgba(16, 185, 129)" : "rgb(239, 68, 68)"}
              strokeLinejoin={"round"}
              strokeWidth="1.5"
              points={points}
            />
          </svg>
        )}
      </div>
    </div>
  );
};

export default React.memo(Chart);
