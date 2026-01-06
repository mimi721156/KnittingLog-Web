
export const STITCH = {
  K: 1,
  M1R: 2,
  NO: 0
};

export function generateChartFromSpec(spec) {
  const { castOn, totalRows, baseStitch, increase } = spec;
  let width = castOn;
  const widths = [];
  const alerts = [];

  for (let r = 1; r <= totalRows; r++) {
    widths.push(width);
    if (r % increase.every === 0) {
      alerts.push({
        row: r,
        message: `加針 +${increase.stitches} (${increase.method})`
      });
      width += increase.stitches;
    }
  }

  const maxCols = Math.max(...widths);
  const grid = widths.map((w, idx) => {
    const row = [];
    for (let c = 0; c < maxCols; c++) {
      if (c < w) {
        row.push(STITCH[baseStitch]);
      } else {
        row.push(STITCH.NO);
      }
    }
    if ((idx + 1) % increase.every === 0) {
      row[w - 1] = STITCH[increase.method];
    }
    return row;
  });

  return {
    section: {
      rows: totalRows,
      cols: maxCols,
      grid
    },
    alerts
  };
}
