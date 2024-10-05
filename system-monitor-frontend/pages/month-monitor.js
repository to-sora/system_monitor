// pages/month-monitor.js
import { useState, useEffect } from 'react';
import api from '../services/api';

export default function MonthMonitor() {
  const [devices, setDevices] = useState([]);
  const [keys, setKeys] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [aggregatedData, setAggregatedData] = useState(null);
  const [error, setError] = useState('');

  // Fetch devices and keys on component mount
  useEffect(() => {
    const fetchDevicesAndKeys = async () => {
      try {
        const devicesRes = await api.get('/devices');
        const keysRes = await api.get('/keys');
        setDevices(devicesRes.data.devices);
        setKeys(keysRes.data.dataTypes || keysRes.data.keys);
      } catch (err) {
        setError('Failed to fetch devices or keys.');
      }
    };
    fetchDevicesAndKeys();
  }, []);

  const fetchAggregatedData = async () => {
    if (!selectedDevice || !selectedKey) {
      setError('Please select a device and a key.');
      return;
    }
    try {
      const res = await api.get('/data/month', {
        params: {
          device: selectedDevice,
          key: selectedKey,
        },
      });
      setAggregatedData(res.data.data);
    } catch (err) {
      setError('Failed to fetch aggregated data.');
    }
  };

  return (
    <div className="page-container">
      <h1>Month Monitor</h1>
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
        <div className="key-selection">
          <label>Select Key:</label>
          <select
            value={selectedKey}
            onChange={(e) => setSelectedKey(e.target.value)}
          >
            <option value="">-- Select Key --</option>
            {keys.map((key) => (
              <option key={key.keyName} value={key.keyName}>
                {key.keyName}
              </option>
            ))}
          </select>
        </div>
        <button onClick={fetchAggregatedData}>Fetch Aggregated Data</button>
      </div>
      {aggregatedData && (
        <div className="aggregated-data">
          <h2>Aggregated Data</h2>
          <table>
            <tbody>
              <tr>
                <td>Minimum</td>
                <td>{aggregatedData.min}</td>
              </tr>
              <tr>
                <td>Maximum</td>
                <td>{aggregatedData.max}</td>
              </tr>
              <tr>
                <td>Median</td>
                <td>{aggregatedData.median}</td>
              </tr>
              <tr>
                <td>Mean</td>
                <td>{aggregatedData.mean}</td>
              </tr>
              <tr>
                <td>Area Under Curve (AUC)</td>
                <td>{aggregatedData.auc}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
