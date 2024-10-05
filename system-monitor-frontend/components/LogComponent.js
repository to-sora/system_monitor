// components/LogComponent.js



export default function LogComponent({ keyName, logs, style }) {
    return (
      <div className="log-container" style={style}>
        <div style={{ textAlign: 'center', fontWeight: 'normal' }}><br></br><br></br>
  {keyName} Logs
</div>

        <div className="log-content">
          <ul>
            {logs.map((log, index) => (
              <li key={index}>
                {new Date(log.timestamp).toLocaleString()}: {log.value}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  
  