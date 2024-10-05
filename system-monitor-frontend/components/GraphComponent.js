// components/GraphComponent.js
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import { format } from 'date-fns';
// import { console } from 'inspector';
export default function GraphComponent({ keyName, dataPoints, style , keyProperties}) {

  const { normalRange, warningRange } = keyProperties || {};
  const pointColors = dataPoints.map((dp) => {
    const value = dp.value;
  
    if (
      normalRange &&
      typeof normalRange.min === 'number' &&
      typeof normalRange.max === 'number' &&
      value >= normalRange.min &&
      value <= normalRange.max
    ) {
      return 'green'; // Normal range
    } else if (
      warningRange &&
      typeof warningRange.min === 'number' &&
      typeof warningRange.max === 'number' &&
      value >= warningRange.min &&
      value <= warningRange.max
    ) {
      return 'orange'; // Warning range
    } else {
      return 'red'; // Critical range
    }
  });
  const data = {
    labels: dataPoints.map((dp) =>
      new Date(dp.timestamp).toLocaleTimeString()
    ),
    datasets: [
      {
        label: keyName,
        data: dataPoints.map((dp) => dp.value),
        // borderColor: 'rgba(75,192,192,1)',
        fill: false,
        backgroundColor: pointColors,
        pointBackgroundColor: pointColors,
        pointBorderColor: pointColors,
        borderWidth: 1, // Thinner line
        pointRadius: 1, // Remove point dots
        pointHoverRadius: 3, // Optional: Smaller radius on hover
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    
  };
  return (
  
    <div className="graph-container" style={style}>
     
      <div className="chart-wrapper">
      
        <Line 
          data={data} 
          options={{
            ...options,
            plugins: {
              ...options.plugins,
              title: {
                display: true,
                text: keyName, // Set the title as keyName
                font: {
                  size: 15, // Adjust font size for the title
                },
              },
              legend: {
                display: false, // Remove the legend
              },
            },
            scales: {
              x: {
                ticks: {
                  // Reduce font size for labels
                  font: {
                    size: 8, // Adjust font size for x-axis labels
                  },
                  // Format timestamp to exclude hours, minutes, and seconds
                  // callback: function(value, index, values) {
                  //   // Assume value is a timestamp, format it using date-fns or another method
                  //   console.log('value:', value, index, values);
                  //   const formattedDate = format(new Date(value), 'HH mm');
                  //   return formattedDate;
                  // },
                  // Display labels at specific positions only (start, middle, end)
                  maxTicksLimit: 4,
                },
              },
              y: {
                position: 'right', // Position y-axis on the left side
                ticks: {
                  font: {
                    size: 8, // Adjust font size for y-axis labels
                  },
              },}
            },
          }} 
        />
      </div>
    </div>
  );
  return (
    <div className="graph-container" style={style}>
    
      <div className="chart-wrapper">
      <Line 
        data={data} 
        options={{
          ...options,
          plugins: {
            ...options.plugins,
            title: {
              display: true,
              text: keyName, // Set the title as keyName
              font: {
                size: 8, // Optional: adjust font size
              },
            },
            legend: {
              display: false, // Remove the legend
            },
          },
        }} 
      />
      </div>
    </div>
  );

}
