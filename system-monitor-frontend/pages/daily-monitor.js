// pages/daily-monitor.js
import { useState, useEffect } from 'react';
import api from '../services/api';
import GraphComponent from '../components/GraphComponent';
import LogComponent from '../components/LogComponent';

export default function DailyMonitor() {
  const [devices, setDevices] = useState([]);
  const [keys, setKeys] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [timeRange, setTimeRange] = useState('30m');
  const [data, setData] = useState({});
  const [error, setError] = useState('');

  const [isPortrait, setIsPortrait] = useState(true);
  const [graphStyles, setGraphStyles] = useState({});
  const [keysData, setKeysData] = useState({});


  // Fetch devices and keys on component mount
  useEffect(() => {
    const fetchDevicesAndKeys = async () => {
      try {
        const devicesRes = await api.get('/devices');
        const keysRes = await api.get('/keys');
        let devicesList = devicesRes.data.devices;
        let keysList = keysRes.data.dataTypes || keysRes.data.keys;



        // Sort devices alphabetically by name
        devicesList.sort((a, b) => a.name.localeCompare(b.name));

        setDevices(devicesList);
        setKeys(keysList);

        // Auto-select the first device and all keys
        if (devicesList.length > 0) {
          setSelectedDevice(devicesList[0].deviceId);
        }

        if (keysList.length > 0) {
          const allKeyNames = keysList.map((key) => key.keyName);
          setSelectedKeys(allKeyNames);
        }

        const keysDataMap = {};
        keysList.forEach((key) => {
          keysDataMap[key.keyName] = key;
        });
        setKeysData(keysDataMap);

      } catch (err) {
        setError('Failed to fetch devices or keys.');
      }
    };
    fetchDevicesAndKeys();
  }, []);

  // Fetch data when selections change
  useEffect(() => {
    if (!selectedDevice || selectedKeys.length === 0) return;

    const fetchData = async () => {
      try {
        const res = await api.get('/data/daily', {
          params: {
            device: selectedDevice,
            keys: selectedKeys,
            range: timeRange,
          },
        });
        setData(res.data.data);
        setError('');
      } catch (err) {
        setError('Failed to fetch data.');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [selectedDevice, selectedKeys, timeRange]);

  // Handle orientation and calculate graph dimensions
  useEffect(() => {
    const handleResize = () => {
      const { innerWidth, innerHeight } = window;
      const portrait = innerHeight >= innerWidth;
      setIsPortrait(portrait);

      const n = selectedKeys.length;
      if (n === 0) return;

      if (portrait) {
        // Vertical screen
        const heightPercent = 100 / n;
        setGraphStyles({
          width: '100%',
          height: `${heightPercent}vh`,
        });
      } else {
        // Horizontal screen
        const m = Math.ceil(n / 2); // Number of rows
        const heightPercent = 100 / m;
        setGraphStyles({
          width: '50%',
          height: `${heightPercent}vh`,
        });
      }
    };

    handleResize(); // Initial calculation
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [selectedKeys]);

  const handleKeyChange = (keyName) => {
    setSelectedKeys((prev) =>
      prev.includes(keyName)
        ? prev.filter((k) => k !== keyName)
        : [...prev, keyName]
    );
  };

  return (
    <div className="page-container">
      
      {error && <p className="error">{error}</p>}
      <div className="selection-container">
        <div className="device-selection">
          <label>Select Device:</label>
          <select
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
          >
            <option value="">-- Select Device --</option>
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.name}
              </option>
            ))}
          </select>
        </div>
        <div className="keys-selection">
          <div className="keys-checkboxes">
            {keys.map((key) => (
              <label key={key.keyName} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '10px' }}>
                <input
                  type="checkbox"
                  value={key.keyName}
                  onChange={() => handleKeyChange(key.keyName)}
                  checked={selectedKeys.includes(key.keyName)}
                />
                {key.keyName}
              </label>
            ))}
          </div>
        </div>
        <div className="time-range-selection">
          <label>Select Time Range:</label>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="24h">24 Hours</option>
            <option value="12h">12 Hours</option>
            <option value="3h">3 Hours</option>
            <option value="1h">1 Hour</option>
            <option value="30m">30 Minutes</option>
          </select>
        </div>
      </div>
      <div className="data-display-grid">
        {selectedKeys.map((keyName) => {
          const keyData = data[keyName];
          const keyProperties = keysData[keyName];

          if (!keyData) return null;
          const commonProps = {
            key: keyName,
            keyName,
            style: graphStyles,
          };
          return keyData.type === 'float' ? (
          
            <GraphComponent
              {...commonProps}
              dataPoints={keyData.values}
              keyProperties={keyProperties}
              key={keyName}
              keyName={keyName}
            />
          
          ) : (
            <LogComponent {...commonProps} logs={keyData.values} />
          );
        })}
      </div>
    </div>
  );
}
