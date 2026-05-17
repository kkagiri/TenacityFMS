import ApexChart from '@/components/wrappers/ApexChart'
import { useEffect, useState } from 'react'
import ReactApexChart from 'react-apexcharts'
import { Card, CardBody, CardHeader, Col, FormSelect, Row } from 'react-bootstrap'
import {
  getBasicColumnChart,
  getChartWithDataTabels,
  getColumnWithGroupLabelChart,
  getColumnWithMarkersChart,
  getDistributedColumnCharts,
  getDumbbellChart,
  getFullStackedColumnChart,
  getGroupedStackedColumnChart,
  getNegativeValueColumnChart,
  getRangeColumnCharts,
  getRotateLabelColumn,
  getStackedColumnChart,
} from './data'
export const BasicColumnCharts = () => {
  return <ApexChart getOptions={getBasicColumnChart} series={getBasicColumnChart().series} type="bar" height={350} />
}
export const ColumnChartwithDatalabels = () => {
  return <ApexChart getOptions={getChartWithDataTabels} series={getChartWithDataTabels().series} type="bar" height={350} />
}
export const StackedColumnCharts = () => {
  return <ApexChart getOptions={getStackedColumnChart} series={getStackedColumnChart().series} type="bar" height={350} />
}
export const FullStackedColumnChart = () => {
  return <ApexChart getOptions={getFullStackedColumnChart} series={getFullStackedColumnChart().series} type="bar" height={350} />
}
export const GroupedStackedColumnsChart = () => {
  return <ApexChart getOptions={getGroupedStackedColumnChart} series={getGroupedStackedColumnChart().series} type="bar" height={350} />
}
export const DumbbellChart = () => {
  return <ApexChart getOptions={getDumbbellChart} series={getDumbbellChart().series} type="rangeBar" height={350} />
}
export const ColumnwithMarkers = () => {
  return <ApexChart getOptions={getColumnWithMarkersChart} series={getColumnWithMarkersChart().series} type="bar" height={350} />
}
export const ColumnwithGroupLabel = () => {
  return <ApexChart getOptions={getColumnWithGroupLabelChart} series={getColumnWithGroupLabelChart().series} type="bar" height={350} />
}
export const AnnotationsColumnChart = () => {
  return <ApexChart getOptions={getRotateLabelColumn} series={getRotateLabelColumn().series} type="bar" height={350} />
}
export const ColumnChartWithNegative = () => {
  return <ApexChart getOptions={getNegativeValueColumnChart} series={getNegativeValueColumnChart().series} type="bar" height={350} />
}
export const DistributedColumnCharts = () => {
  return <ApexChart getOptions={getDistributedColumnCharts} series={getDistributedColumnCharts().series} type="bar" height={350} />
}
export const RangeColumnCharts = () => {
  return <ApexChart getOptions={getRangeColumnCharts} series={getRangeColumnCharts().series} type="rangeBar" height={350} />
}
export const DynamicLoadedChart = () => {
  const [yearData, setYearData] = useState()
  const [yearOptions, setYearOptions] = useState()
  const [quarterData, setQuarterData] = useState()
  const [quarterOptions, setQuarterOptions] = useState()
  const [colors, setColors] = useState([])

  // Update quarterly chart
  const updateQuarterChart = (sourceSeries, selectedIndexes) => {
    if (!selectedIndexes || selectedIndexes.length === 0) {
      setQuarterData([])
      return
    }
    const series = []
    const colorTokens = []
    selectedIndexes.forEach((i) => {
      const item = sourceSeries.data[i]
      const values = quarterLabels.map((q) => {
        const found = item.quarters.find((entry) => entry.x === q)
        return found?.y || 0
      })
      series.push({
        name: item.x,
        data: values,
      })
      colorTokens.push(colorMap[item.colorToken] || '#000000')
    })
    setQuarterData(series)
    setColors(colorTokens)
  }

  // Initialize both charts
  const initializeCharts = () => {
    const data = makeData()
    const colorTokens = data.map((d) => colorMap[d.colorToken] || '#000000')
    const yearChartOptions = {
      chart: {
        id: 'barYear',
        type: 'bar',
        height: 400,
        events: {
          dataPointSelection: (_e, chart, opts) => {
            const selected = opts.selectedDataPoints[0]
            if (selected && selected.length > 0) {
              updateQuarterChart(chart.w.config.series[0], selected)
            } else {
              setQuarterData([])
            }
          },
          updated: (chart) => {
            const selected = chart.w.globals.selectedDataPoints[0]
            if (selected && selected.length > 0) {
              updateQuarterChart(chart.w.config.series[0], selected)
            }
          },
        },
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          distributed: true,
          horizontal: true,
          barHeight: '75%',
          dataLabels: {
            position: 'bottom',
          },
        },
      },
      dataLabels: {
        enabled: true,
        style: {
          colors: ['#fff'],
        },
        formatter: (_val, opt) => opt.w.globals.labels[opt.dataPointIndex],
        offsetX: 10,
        dropShadow: {
          enabled: true,
        },
      },
      colors: colorTokens,
      tooltip: {
        x: {
          show: false,
        },
        y: {
          title: {
            formatter: (_val, opt) => opt.w.globals.labels[opt.dataPointIndex],
          },
        },
      },
      states: {
        active: {
          allowMultipleDataPointsSelection: true,
          filter: {
            type: 'darken',
          },
        },
      },
      title: {
        text: 'Yearly Results',
        offsetX: 5,
        style: {
          fontSize: '14px',
          fontWeight: 700,
        },
      },
      subtitle: {
        text: '(Click on bar to see details)',
        offsetX: 5,
        style: {
          fontSize: '12px',
          fontWeight: 500,
        },
      },
      xaxis: {
        axisBorder: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          show: false,
        },
      },
      grid: {
        borderColor: colorMap['border-color'],
        padding: {
          top: -10,
          right: 0,
          bottom: -15,
          left: 0,
        },
      },
      legend: {
        show: false,
      },
    }
    const quarterChartOptions = {
      chart: {
        id: 'barQuarter',
        height: 400,
        type: 'bar',
        stacked: true,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          columnWidth: '50%',
          horizontal: false,
        },
      },
      xaxis: {
        categories: quarterLabels,
        axisBorder: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          show: false,
        },
      },
      legend: {
        show: false,
      },
      grid: {
        yaxis: {
          lines: {
            show: false,
          },
        },
        xaxis: {
          lines: {
            show: true,
          },
        },
      },
      colors,
      title: {
        text: 'Quarterly Results',
        offsetX: 10,
        style: {
          fontSize: '14px',
          fontWeight: 700,
        },
      },
      tooltip: {
        x: {
          formatter: (_val, opts) => opts.w.globals.seriesNames[opts.seriesIndex],
        },
        y: {
          title: {
            formatter: (_val, opts) => opts.w.globals.labels[opts.dataPointIndex],
          },
        },
      },
    }
    setYearData([
      {
        data,
      },
    ])
    setYearOptions(yearChartOptions)
    setQuarterOptions(quarterChartOptions)
    setQuarterData([])
    setColors([])
  }
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      initializeCharts()
    }, 0)
    return () => {
      clearTimeout(timeoutId)
    }
  }, [])
  return (
    <Card>
      <CardHeader className="d-flex justify-content-between align-items-center border-dashed">
        <h4 className="card-title mb-0">Dynamic Loaded Chart</h4>
        <div className="flex-shrink-0">
          <FormSelect size="sm" onChange={initializeCharts}>
            <option value="iphone5">iPhone 5</option>
            <option value="iphone6">iPhone 6</option>
            <option value="iphone7">iPhone 7</option>
          </FormSelect>
        </div>
      </CardHeader>

      <CardBody className="pt-0">
        <h4 className="header-title"></h4>
        <Row>
          <Col sm={6}>{yearOptions && yearData && <ReactApexChart options={yearOptions} series={yearData} type="bar" height={400} />}</Col>
          <Col sm={6}>
            {quarterOptions && (
              <ReactApexChart
                options={{
                  ...quarterOptions,
                  colors,
                }}
                series={quarterData || []}
                type="bar"
                height={400}
              />
            )}
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}
const colorMap = {
  primary: '#6658dd',
  secondary: '#4a81d4',
  info: '#43bfe5',
  danger: '#f1556c',
  warning: '#f7b84b',
  success: '#1abc9c',
  'border-color': '#e7e9eb',
}
const quarterLabels = ['Q1', 'Q2', 'Q3', 'Q4']
const arrayData = [
  {
    y: 400,
    quarters: [
      {
        x: 'Q1',
        y: 120,
      },
      {
        x: 'Q2',
        y: 90,
      },
      {
        x: 'Q3',
        y: 100,
      },
      {
        x: 'Q4',
        y: 90,
      },
    ],
    colorToken: 'primary',
  },
  {
    y: 430,
    quarters: [
      {
        x: 'Q1',
        y: 120,
      },
      {
        x: 'Q2',
        y: 110,
      },
      {
        x: 'Q3',
        y: 90,
      },
      {
        x: 'Q4',
        y: 110,
      },
    ],
    colorToken: 'secondary',
  },
  {
    y: 448,
    quarters: [
      {
        x: 'Q1',
        y: 70,
      },
      {
        x: 'Q2',
        y: 100,
      },
      {
        x: 'Q3',
        y: 140,
      },
      {
        x: 'Q4',
        y: 138,
      },
    ],
    colorToken: 'info',
  },
  {
    y: 470,
    quarters: [
      {
        x: 'Q1',
        y: 150,
      },
      {
        x: 'Q2',
        y: 60,
      },
      {
        x: 'Q3',
        y: 190,
      },
      {
        x: 'Q4',
        y: 70,
      },
    ],
    colorToken: 'danger',
  },
  {
    y: 540,
    quarters: [
      {
        x: 'Q1',
        y: 120,
      },
      {
        x: 'Q2',
        y: 120,
      },
      {
        x: 'Q3',
        y: 130,
      },
      {
        x: 'Q4',
        y: 170,
      },
    ],
    colorToken: 'warning',
  },
  {
    y: 580,
    quarters: [
      {
        x: 'Q1',
        y: 170,
      },
      {
        x: 'Q2',
        y: 130,
      },
      {
        x: 'Q3',
        y: 120,
      },
      {
        x: 'Q4',
        y: 160,
      },
    ],
    colorToken: 'success',
  },
]
const shuffleArray = (array) => {
  const newArr = [...array]
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArr[i], newArr[j]] = [newArr[j], newArr[i]]
  }
  return newArr
}
const makeData = () => {
  const dataset = shuffleArray(arrayData)
  return dataset.map((item, index) => ({
    x: `${2019 + index}`,
    y: item.y,
    colorToken: item.colorToken,
    quarters: item.quarters,
  }))
}
