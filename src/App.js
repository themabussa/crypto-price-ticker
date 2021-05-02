import { useCallback, useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";
import { useLocalStorage } from "react-use";
import useInterval from "@use-it/interval";
import { getCurrencies, getProducts, get24HourStats } from "./api";
import {
  SOCKET_STATUSES,
  WS_URL,
  DEFAULT_SELECTED_PRODUCT_IDS,
} from "./constants";
import {
  getPrettyPrice,
  buildSubscribeMessage,
  flashPriceColorChange,
} from "./utils";
import { Settings, ProductSection, Header, Footer } from "./components";

function App() {
  const [showSettings, setShowSettings] = useState(false);
  const [currencies, setCurrencies] = useState({});
  const [products, setProducts] = useState({});
  const [prices, setPrices] = useState({});
  const [stats, setStats] = useState({});

  useEffect(() => {
    const set = async () => {
      setProducts(await getProducts());
      setCurrencies(await getCurrencies());
    };
    set();
  }, []);

  const [selectedProductIds, setSelectedProductIds] = useLocalStorage(
    "selectedProductIds",
    DEFAULT_SELECTED_PRODUCT_IDS
  );

  const { sendJsonMessage, readyState } = useWebSocket(WS_URL, {
    onOpen: () => {
      sendJsonMessage(buildSubscribeMessage("subscribe", selectedProductIds));
    },
    onMessage: (event) => handleMessage(JSON.parse(event.data)),
    onError: (event) => console.log(event),
    shouldReconnect: (closeEvent) => true,
    retryOnError: true,
  });

  useInterval(() => {
    const set = async () => {
      const newStats = await get24HourStats(selectedProductIds);
      setStats(newStats);
    };
    set();
  }, 60000);

  useEffect(() => {
    const set = async () => {
      const newStats = await get24HourStats(selectedProductIds);
      setStats(newStats);
    };
    set();
  }, [selectedProductIds]);

  useEffect(() => {
    document.getElementById("favicon").href =
      SOCKET_STATUSES[readyState].favicon;
  }, [readyState]);

  const handleMessage = ({ type, product_id: productId, price: rawPrice }) => {
    if (type === "ticker") {
      if (!prices[productId])
        setPrices({ ...prices, [productId]: { prevPrice: 0 } });

      const price = getPrettyPrice(Number.parseFloat(rawPrice));

      const priceEl = document.getElementById(`${productId}Price`);
      if (priceEl)
        flashPriceColorChange(price, prices[productId]?.prevPrice, priceEl);

      const newPrices = {
        ...prices,
        [productId]: { prevPrice: price, price },
      };
      setPrices(newPrices);

      if (productId === "BTC-USD") document.title = price + " BTC-USD";
    }
  };

  const toggleProduct = useCallback(
    (productId) => {
      const showProduct = !selectedProductIds.includes(productId);

      sendJsonMessage(
        buildSubscribeMessage(showProduct ? "subscribe" : "unsubscribe", [
          productId,
        ])
      );

      const stable = selectedProductIds.filter((p) => p !== productId);
      const newProducts = [...stable, ...(showProduct ? [productId] : [])];

      setSelectedProductIds(newProducts);
    },
    [sendJsonMessage, selectedProductIds, setSelectedProductIds]
  );

  return (
    <>
      <Header
        title={SOCKET_STATUSES[readyState].name}
        titleClass={SOCKET_STATUSES[readyState].class}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
      />
      <Settings
        showSettings={showSettings}
        products={products}
        selectedProducts={selectedProductIds}
        toggleProduct={toggleProduct}
      />
      <div className="flex flex-wrap p-4">
        {!!Object.keys(currencies).length &&
          !!Object.keys(products).length &&
          selectedProductIds.map((selectedProductId) => {
            return (
              <ProductSection
                key={selectedProductId}
                product={products[selectedProductId]}
                productPrice={prices[selectedProductId]}
                productStats={stats[selectedProductId]}
                currency={currencies[products[selectedProductId].base_currency]}
              />
            );
          })}
      </div>
      <Footer />
    </>
  );
}

export default App;