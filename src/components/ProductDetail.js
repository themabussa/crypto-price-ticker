import React from "react";
import { useParams } from "react-router";
import { useMeasure, useMedia } from "react-use";
import History from "./History";
import TradingViewWidget from "react-tradingview-widget";

const ProductDetail = () => {
  const [ref, { height }] = useMeasure();
  const { productId } = useParams();
  const isDark = useMedia("(prefers-color-scheme: dark)");

  return (
    <div
      ref={ref}
      className="h-full flex-grow flex flex-col md:flex-row gap-4 p-4"
    >
      <div className="flex flex-grow">
        <TradingViewWidget
          symbol={`COINBASE:${productId.replace("-", "")}`}
          autosize
          theme={isDark ? "Dark" : "Light"}
        />
      </div>
      <div
        className="hidden md:block overflow-y-hidden h-full"
        style={{ maxHeight: height }}
      >
        <History productId={productId} />
      </div>
    </div>
  );
};

export default React.memo(ProductDetail);
