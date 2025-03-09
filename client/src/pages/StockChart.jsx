import React, { useEffect, useState } from "react";
import "../styles/StockChart.css";
import Chart from "react-apexcharts";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";

const StockChart = () => {
  const [stockAction, setStockAction] = useState("buy");
  const { id } = useParams();
  const [stockValues, setStockValues] = useState([]);
  const [stockPrice, setStockPrice] = useState(null);
  const [stockExchange, setStockExchange] = useState("");

  const [buyQuantity, setBuyQuantity] = useState(0);
  const [buyType, setBuyType] = useState("Intraday");
  const [sellQuantity, setSellQuantity] = useState(0);
  const [sellType, setSellType] = useState("Intraday");

  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  // Transform API data for chart series
  const transformAndAppendData = (apiResponse) => {
    const { open, high, low, close, datetime } = apiResponse;
    const transformedObject = {
      x: new Date(datetime).getTime(),
      y: [
        parseFloat(open),
        parseFloat(high),
        parseFloat(low),
        parseFloat(close),
      ],
    };
    setStockValues((prevData) => [...prevData, transformedObject]);
  };

  // Options for fetching time series data
  const optionsData = {
    method: "GET",
    url: "https://twelve-data1.p.rapidapi.com/time_series",
    params: {
      symbol: id,
      interval: "1min",
      outputsize: "100",
      format: "json",
    },
    headers: {
      "X-RapidAPI-Key": "947b801f92msh96b919932628932p1a1413jsncb9cc7188719",
      "X-RapidAPI-Host": "twelve-data1.p.rapidapi.com",
    },
  };

  // Options for fetching current price
  const optionsPrice = {
    method: "GET",
    url: "https://twelve-data1.p.rapidapi.com/price",
    params: {
      symbol: id,
      format: "json",
      outputsize: "30",
    },
    headers: {
      "X-RapidAPI-Key": "947b801f92msh96b919932628932p1a1413jsncb9cc7188719",
      "X-RapidAPI-Host": "twelve-data1.p.rapidapi.com",
    },
  };

  useEffect(() => {
    fetchStockData();
    fetchPrice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch time series data and transform for chart
  const fetchStockData = async () => {
    try {
      const response = await axios.request(optionsData);
      console.log(response.data.meta);
      setStockExchange(response.data.meta.exchange);
      const apiResponses = response.data.values;
      apiResponses.forEach((apiResponse) => {
        transformAndAppendData(apiResponse);
      });
    } catch (error) {
      console.error("Error fetching stock data:", error);
    }
  };

  // Fetch the current stock price
  const fetchPrice = async () => {
    try {
      const response = await axios.request(optionsPrice);
      setStockPrice(parseFloat(response.data.price));
    } catch (error) {
      console.error("Error fetching price:", error);
    }
  };

  const series = [
    {
      data: stockValues,
    },
  ];

  const chartOptions = {
    chart: {
      type: "candlestick",
      height: 350,
    },
    title: {
      text: `${id} ${stockExchange}`,
      align: "left",
    },
    xaxis: {
      type: "datetime",
    },
    yaxis: {
      tooltip: {
        enabled: true,
      },
    },
  };

  // Buy stock transaction
  const buyStock = async (e) => {
    e.preventDefault();

    const searchOptions = {
      method: "GET",
      url: "https://twelve-data1.p.rapidapi.com/symbol_search",
      params: {
        symbol: id,
        outputsize: "1",
      },
      headers: {
        "X-RapidAPI-Key": "947b801f92msh96b919932628932p1a1413jsncb9cc7188719",
        "X-RapidAPI-Host": "twelve-data1.p.rapidapi.com",
      },
    };

    try {
      const res = await axios.request(searchOptions);
      const instrumentName = res.data.data[0].instrument_name;
      await axios.post("http://localhost:6001/buyStock", {
        user: userId,
        symbol: id,
        name: instrumentName,
        stockType: buyType,
        stockExchange: stockExchange,
        price: stockPrice,
        count: buyQuantity,
        totalPrice: stockPrice * buyQuantity,
      });
      setBuyQuantity(0);
      setBuyType("Intraday");
      navigate("/history");
    } catch (error) {
      console.error("Buy transaction failed:", error);
      alert("Transaction failed!!");
    }
  };

  // Sell stock transaction
  const sellStock = async (e) => {
    e.preventDefault();

    const searchOptions = {
      method: "GET",
      url: "https://twelve-data1.p.rapidapi.com/symbol_search",
      params: {
        symbol: id,
        outputsize: "1",
      },
      headers: {
        "X-RapidAPI-Key": "947b801f92msh96b919932628932p1a1413jsncb9cc7188719",
        "X-RapidAPI-Host": "twelve-data1.p.rapidapi.com",
      },
    };

    try {
      const res = await axios.request(searchOptions);
      const instrumentName = res.data.data[0].instrument_name;
      await axios.post("http://localhost:6001/sellStock", {
        user: userId,
        symbol: id,
        name: instrumentName,
        stockType: sellType,
        price: stockPrice,
        count: sellQuantity,
        totalPrice: stockPrice * sellQuantity,
      });
      setSellQuantity(0);
      setSellType("Intraday");
      navigate("/history");
    } catch (error) {
      console.error("Sell transaction failed:", error);
      alert("Transaction failed!!");
    }
  };

  return (
    <div className="stockPage">
      <div className="stockChart">
        <Chart
          options={chartOptions}
          series={series}
          type="candlestick"
          height="100%"
        />
      </div>
      <div className="stockChartActions">
        <div className="stockChartActions-head">
          <button
            className={stockAction === "buy" ? "button-active" : "button-inactive"}
            onClick={() => setStockAction("buy")}
          >
            Buy {stockPrice ? ` @ $${stockPrice}` : ""}
          </button>
          <button
            className={stockAction === "sell" ? "button-active" : "button-inactive"}
            onClick={() => setStockAction("sell")}
          >
            Sell {stockPrice ? ` @ $${stockPrice}` : ""}
          </button>
        </div>
        <div className="stockChartActions-body">
          {stockAction === "buy" ? (
            <form onSubmit={buyStock}>
              <div className="mb-3">
                <label htmlFor="inputProductType" className="form-label">
                  Product type
                </label>
                <select
                  className="form-select"
                  id="inputProductType"
                  aria-label="Default select example"
                  onChange={(e) => setBuyType(e.target.value)}
                  value={buyType}
                >
                  <option value="Intraday">Intraday</option>
                  <option value="Delivery">Delivery</option>
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="inputStockQuantity" className="form-label">
                  Quantity
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="inputStockQuantity"
                  onChange={(e) => setBuyQuantity(e.target.value)}
                  value={buyQuantity}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="inputStockTotalPrice" className="form-label">
                  Total price
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="inputStockTotalPrice"
                  disabled
                  value={buyQuantity && stockPrice ? buyQuantity * stockPrice : 0}
                />
              </div>
              <button className="btn btn-success" type="submit">
                Buy now
              </button>
            </form>
          ) : (
            <form onSubmit={sellStock}>
              <div className="mb-3">
                <label htmlFor="inputProductTypeSell" className="form-label">
                  Product type
                </label>
                <select
                  className="form-select"
                  id="inputProductTypeSell"
                  aria-label="Default select example"
                  onChange={(e) => setSellType(e.target.value)}
                  value={sellType}
                >
                  <option value="Intraday">Intraday</option>
                  <option value="Delivery">Delivery</option>
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="inputStockQuantitySell" className="form-label">
                  Quantity
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="inputStockQuantitySell"
                  onChange={(e) => setSellQuantity(e.target.value)}
                  value={sellQuantity}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="inputStockTotalPriceSell" className="form-label">
                  Total price
                </label>
                <input
                  type="number"
                  className="form-control"
                  id="inputStockTotalPriceSell"
                  disabled
                  value={sellQuantity && stockPrice ? sellQuantity * stockPrice : 0}
                />
              </div>
              <button className="btn btn-danger" type="submit">
                Sell now
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockChart;
