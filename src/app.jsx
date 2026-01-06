
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { generateChartFromSpec } from './generateChart';

function App() {
  const [pattern, setPattern] = useState({ sections: [], alerts: [] });

  const generate = () => {
    const spec = {
      castOn: 6,
      totalRows: 30,
      baseStitch: 'K',
      increase: { every: 6, stitches: 1, method: 'M1R' }
    };
    const { section, alerts } = generateChartFromSpec(spec);
    setPattern({
      sections: [section],
      alerts
    });
  };

  return (
    <div>
      <h1>KnittingLog</h1>
      <button onClick={generate}>自動產生織圖（範例）</button>
      <pre>{JSON.stringify(pattern, null, 2)}</pre>
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
