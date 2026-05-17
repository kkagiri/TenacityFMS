import stockSmallImg6 from '@/assets/images/stock/small-6.jpg'
import { getColor } from '@/utils/helpers'
import { ApexOptions } from 'apexcharts'

// BASIC RADIALBAR CHART

export const getBasicRadialBarChart = (): ApexOptions => ({
  chart: {
    height: 320,
    type: 'radialBar',
  },
  plotOptions: {
    radialBar: {
      hollow: {
        // margin: 2,
        size: '70%',
      },
      track: {
        background: 'rgba(170,184,197, 0.2)',
      },
    },
  },
  series: [82],
  labels: ['Task Completion'],
  colors: [getColor('chart-alpha')],
})

// MULTIPLE RADIALBARS

export const getMultipleRadialBarChart = (): ApexOptions => ({
  chart: {
    height: 320,
    type: 'radialBar',
  },
  plotOptions: {
    radialBar: {
      track: {
        margin: 20,
        background: 'rgba(170,184,197, 0.2)',
      },
      hollow: {
        size: '5%',
      },
      dataLabels: {
        name: {
          show: false,
        },
        value: {
          show: false,
        },
      },
    },
  },
  stroke: {
    lineCap: 'round',
  },
  series: [75, 60, 85],
  labels: ['Marketing', 'Sales', 'Engineering', 'HR'],
  responsive: [
    {
      breakpoint: 380,
      options: {
        chart: {
          height: 260,
        },
      },
    },
  ],
  colors: [getColor('chart-secondary'), getColor('chart-beta'), getColor('chart-primary')],
})

// CIRCLE CHART - CUSTOM ANGLE

export const getCircleAngleChart = (): ApexOptions => ({
  chart: {
    height: 380,
    type: 'radialBar',
  },
  plotOptions: {
    radialBar: {
      offsetY: -30,
      startAngle: 0,
      endAngle: 270,
      hollow: {
        margin: 5,
        size: '30%',
        background: 'transparent',
        image: undefined,
      },
      track: {
        background: 'rgba(170,184,197, 0.2)',
      },
      dataLabels: {
        name: {
          show: false,
        },
        value: {
          show: false,
        },
      },
    },
  },
  series: [82, 65, 74, 58],
  labels: ['Instagram', 'YouTube', 'TikTok', 'Snapchat'],
  colors: [getColor('chart-zeta'), getColor('chart-secondary'), getColor('chart-delta'), getColor('chart-beta')],
  legend: {
    show: true,
    floating: true,
    fontSize: '14px',
    fontWeight: 500,
    position: 'left',
    offsetX: 10,
    offsetY: 10,
    labels: {
      useSeriesColors: true,
    },
    markers: {
      size: 5,
    },
    formatter: function (seriesName: string, opts: any) {
      return seriesName + ':  ' + opts.w.globals.series[opts.seriesIndex]
    },
    itemMargin: {
      horizontal: 1,
    },
  },
  responsive: [
    {
      breakpoint: 480,
      options: {
        legend: {
          show: false,
        },
      },
    },
  ],
})

// CIRCLE CHART WITH IMAGE

export const getImageRadialBarChart = (): ApexOptions => ({
  chart: {
    height: 360,
    type: 'radialBar',
  },
  fill: {
    type: 'image',
    image: {
      src: [stockSmallImg6],
    },
  },
  plotOptions: {
    radialBar: {
      hollow: {
        size: '70%',
      },
    },
  },
  series: [82],
  stroke: {
    lineCap: 'round',
  },
  labels: ['Portfolio Growth'],
  grid: {
    padding: { bottom: -5, top: -5 },
  },
  responsive: [
    {
      breakpoint: 380,
      options: {
        chart: {
          height: 280,
        },
      },
    },
  ],
})

// STROKED CIRCULAR GUAGE

export const getStrokedGuageRadialChart = (): ApexOptions => ({
  chart: {
    height: 380,
    type: 'radialBar',
  },
  plotOptions: {
    radialBar: {
      startAngle: -135,
      endAngle: 135,
      dataLabels: {
        name: {
          fontSize: '14px',
          fontWeight: 500,
          offsetY: 120,
        },
        value: {
          offsetY: 76,
          fontSize: '22px',
          color: undefined,
          formatter: function (val: number) {
            return val + '%'
          },
        },
      },
      track: {
        background: 'rgba(170,184,197, 0.2)',
        margin: 0,
      },
    },
  },
  colors: [getColor('chart-secondary')],
  fill: {
    gradient: {
      // enabled: true,
      shade: 'dark',
      shadeIntensity: 0.2,
      inverseColors: false,
      opacityFrom: 1,
      opacityTo: 1,
      stops: [0, 50, 65, 91],
    },
  },
  stroke: {
    dashArray: 4,
  },
  series: [58],
  labels: ['CPU Utilization'],
  grid: {
    padding: { bottom: -10, top: -10 },
  },
  responsive: [
    {
      breakpoint: 380,
      options: {
        chart: {
          height: 280,
        },
      },
    },
  ],
})

// GRADIENT CIRCULAR CHART

export const getGuageCircularRadialChart = (): ApexOptions => ({
  chart: {
    height: 330,
    type: 'radialBar',
    toolbar: {
      show: false,
    },
  },
  plotOptions: {
    radialBar: {
      startAngle: -135,
      endAngle: 225,
      hollow: {
        margin: 0,
        size: '70%',
        background: 'transparent',
        image: undefined,
        imageOffsetX: 0,
        imageOffsetY: 0,
        position: 'front',
        dropShadow: {
          enabled: true,
          top: 3,
          left: 0,
          blur: 4,
          opacity: 0.24,
        },
      },
      track: {
        background: 'rgba(170,184,197, 0.2)',
        strokeWidth: '67%',
        margin: 0,
      },

      dataLabels: {
        show: true,
        name: {
          offsetY: -10,
          show: true,
          fontSize: '14px',
          fontWeight: 500,
        },
        value: {
          show: true,
          formatter: function (val: number) {
            return val.toString()
          },
          color: '#111',
          fontSize: '36px',
        },
      },
    },
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'dark',
      type: 'horizontal',
      shadeIntensity: 0.5,
      inverseColors: true,
      opacityFrom: 1,
      opacityTo: 1,
      stops: [0, 100],
    },
  },
  series: [62],
  stroke: {
    lineCap: 'round',
  },
  labels: ['System Load'],
  colors: [getColor('chart-delta'), getColor('chart-zeta')],
})

// SEMI CIRCLE GAUGE

export const getSemiCircleGuageRadialChart = (): ApexOptions => ({
  series: [80],
  chart: {
    type: 'radialBar',
    offsetY: -20,
    sparkline: {
      enabled: true,
    },
  },
  plotOptions: {
    radialBar: {
      startAngle: -90,
      endAngle: 90,
      track: {
        background: 'rgba(170,184,197, 0.2)',
        strokeWidth: '97%',
        margin: 5, // margin is in pixels
        dropShadow: {
          top: 2,
          left: 0,
          color: '#15529cff',
          opacity: 1,
          blur: 2,
        },
      },
      dataLabels: {
        name: {
          show: false,
        },
        value: {
          offsetY: -2,
          fontSize: '22px',
        },
      },
    },
  },
  grid: {
    padding: {
      top: -10,
    },
  },
  labels: ['Average Results'],
  colors: [getColor('chart-beta') || '#727cf5'],
})
