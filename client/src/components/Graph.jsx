import { useEffect, useState } from 'react'
import { LineChart, XAxis, YAxis, Legend, Tooltip, Line, CartesianGrid } from 'recharts';
import { useParams } from 'react-router-dom';
import axios from 'axios'
import Search from './Search';
const Graph = () => {
  const [height, setHeight] = useState(window.innerHeight);
  const [width, setWidth] = useState(window.innerWidth);
  const [dataArray, setdataArray] = useState([]);
  const [loading, setLoading] = useState(true);
  const { instrumentId } = useParams();
  useEffect(() => {
    function handleResize() {
      setHeight(window.innerHeight)
      setWidth(window.innerWidth)
      console.log(height, width)
    }
    function throttle(fn) {
      let inthrottle = true;
      return (...args) => {
        if (inthrottle) {
          fn(...args);
          inthrottle = false;
          setTimeout(() => {
            inthrottle = true;
          }, 500);
        }
      }
    }
    const handleResizeThrottle = throttle(handleResize)
    window.addEventListener('resize', handleResizeThrottle)
    return () => {
      window.removeEventListener('resize', handleResizeThrottle)
    }
  }, [])
  useEffect(() => {
    fetchInstrument();
  }, [instrumentId])
  const fetchInstrument = async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/${instrumentId}`);
      setdataArray(data)
    } catch (e) {
      console.log(e)
    } finally {
      setLoading(false)
    }
  }
  if (loading) return <h1>Loading...</h1>

  return (
    <>
      <Search />
      {dataArray.length == 0 && !loading && <h1>No Data</h1>}
      {dataArray.length > 0 && !loading && <>
        <LineChart width={width - 50} height={height - 100} data={dataArray}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(time) => {
              const date = new Date(time);

              return date.toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
              });
            }}
          />
          <YAxis />
          <Tooltip
  labelFormatter={(label) =>
    new Date(label).toLocaleString('en-IN')
  }
/>
          <Legend />
          <Line type="monotone" dataKey="maxValue" stroke="#8884d8" />
          <Line type="monotone" dataKey="value" stroke="#82ca9d" />
          <Line type="monotone" dataKey="minValue" stroke="#8884d8" />

        </LineChart>
      </>}

    </>
  )
}

export default Graph
