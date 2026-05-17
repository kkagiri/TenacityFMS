import EChart from '@/components/wrappers/EChart'
import Icon from '@/components/wrappers/Icon'
import { getColor } from '@/utils/helpers'
import { EChartsOption } from 'echarts'
import { LineChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Link } from 'react-router'
import { ordersStatsData } from './data'

const getOrdersStatsOptions = (): EChartsOption => {
  const category = []
  const today = new Date()
  const completedOrders = []
  const processingOrders = []
  const cancelledOrders = []

  for (let i = -14; i <= 0; i++) {
    const currentDate = new Date()
    currentDate.setDate(today.getDate() + i)

    // Format: 03 May 25
    const formattedDate = currentDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: '2-digit',
    })
    category.push(formattedDate)

    const completed = Math.floor(Math.random() * 200)
    const processing = Math.floor(Math.random() * 150)
    const cancelled = Math.floor(Math.random() * 50)

    completedOrders.push(completed)
    processingOrders.push(processing)
    cancelledOrders.push(cancelled)
  }

  return {
    tooltip: {
      trigger: 'axis',
      padding: [8, 15],
      backgroundColor: getColor('card'),
      borderColor: getColor('default-200'),
      textStyle: { color: getColor('default-600') },
      borderWidth: 1,
      transitionDuration: 0.125,
      axisPointer: { type: 'none' },
      shadowBlur: 2,
      shadowColor: 'rgba(76, 76, 92, 0.15)',
      shadowOffsetX: 0,
      shadowOffsetY: 1,
      formatter: function (params: any) {
        const rawDate = new Date()
        rawDate.setDate(today.getDate() - 14 + params[0].dataIndex)

        const formattedDate = rawDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })

        const seriesInfo = params
          .map((item: any) => {
            return `${item.marker} ${item.seriesName}: <span class="fw-bold">${item.value}</span> Orders`
          })
          .join('<br/>')

        return `<div class="mb-1 text-body">${formattedDate}</div>${seriesInfo}`
      },
    },
    legend: {
      data: ['Completed', 'Processing', 'Cancelled'],
      top: 15,
      textStyle: {
        color: getColor('body-color'),
      },
    },
    textStyle: {
      fontFamily: getComputedStyle(document.body).fontFamily,
    },
    xAxis: {
      data: category,
      axisLine: {
        lineStyle: {
          type: 'dashed',
          color: getColor('chart-border-color'),
        },
      },
      axisLabel: {
        show: true,
        color: getColor('body-color'),
      },
      splitLine: {
        lineStyle: {
          color: getColor('chart-border-color'),
          type: 'dashed',
        },
      },
    },
    yAxis: {
      axisLine: {
        lineStyle: {
          type: 'dashed',
          color: getColor('chart-border-color'),
        },
      },
      axisLabel: {
        show: true,
        color: getColor('body-color'),
      },
      splitLine: {
        show: false,
        lineStyle: {
          color: getColor('chart-border-color'),
          type: 'dashed',
        },
      },
    },
    grid: {
      left: 25,
      right: 25,
      bottom: 25,
      top: 60,
      containLabel: true,
    },
    series: [
      {
        name: 'Completed',
        type: 'line',
        smooth: true,
        itemStyle: {
          color: getColor('success'),
        },
        showAllSymbol: true,
        symbol: 'emptyCircle',
        symbolSize: 5,
        data: completedOrders,
      },
      {
        name: 'Processing',
        type: 'bar',
        barWidth: 14,
        itemStyle: {
          borderRadius: [5, 5, 0, 0],
          color: getColor('secondary'),
        },
        data: processingOrders,
      },
      {
        name: 'Cancelled',
        type: 'bar',
        barWidth: 14,
        itemStyle: {
          borderRadius: [5, 5, 0, 0],
          color: '#bbcae14d',
        },
        data: cancelledOrders,
      },
    ],
  }
}

const OrdersStatics = () => {
  return (
    <>
      <div className="card-header py-0 border-dashed card-tabs flex items-center">
        <div className="grow">
          <h4 className="card-title">Orders Statics</h4>
        </div>
        <nav id="hs-tabs" className="flex gap-x-1" aria-label="Tabs" role="tablist" aria-orientation="horizontal">
          <button
            type="button"
            className="hs-tab-active:text-primary hs-tab-active:border-b py-4.25 font-medium hs-tab-active:border-primary relative px-4 text-sm whitespace-nowrap hover:text-primary focus:outline-hidden focus:text-primary disabled:opacity-50 disabled:pointer-events-none"
            id="today"
            aria-selected="true"
            data-hs-tab="#today-tab"
            aria-controls="today-tab"
            role="tab"
          >
            <Icon icon="home" className="md:hidden block" />
            Today
          </button>
          <button
            type="button"
            className="hs-tab-active:text-primary hs-tab-active:border-b py-4.25 font-medium hs-tab-active:border-primary relative px-4 text-sm whitespace-nowrap hover:text-primary focus:outline-hidden focus:text-primary disabled:opacity-50 disabled:pointer-events-none active"
            id="monthly"
            aria-selected="false"
            data-hs-tab="#monthly-tab"
            aria-controls="monthly-tab"
            role="tab"
          >
            <Icon icon="user-circle" className="md:hidden block" />
            Monthly
          </button>
          <button
            type="button"
            className="hs-tab-active:text-primary hs-tab-active:border-b py-4.25 font-medium hs-tab-active:border-primary relative px-4 text-sm whitespace-nowrap hover:text-primary focus:outline-hidden focus:text-primary disabled:opacity-50 disabled:pointer-events-none"
            id="annual"
            aria-selected="false"
            data-hs-tab="#annual-tab"
            aria-controls="annual-tab"
            role="tab"
          >
            <Icon icon="settings" className="md:hidden block" />
            Annual
          </button>
        </nav>
      </div>
      <div className="grid xl:grid-cols-3 grid-cols-1">
        <div className="xl:col-span-2 border-e border-dashed border-default-300">
          <EChart extensions={[LineChart, TooltipComponent, CanvasRenderer]} getOptions={getOrdersStatsOptions} style={{ height: 405 }} />
        </div>
        <div className="col-span-1">
          <div className="p-5 bg-light/20 border-b border-dashed border-default-300">
            <div className="flex justify-between items-center">
              <div className="col">
                <h4 className="text-sm mb-1.25">Would you like the full report?</h4>
                <small className="text-default-400 text-xs"> All 120 orders have been successfully delivered </small>
              </div>
              <div className="ms-auto">
                <div className="hs-tooltip [--placement:top] inline-block">
                  <button type="button" className="hs-tooltip-toggle size-7.75 flex justify-center items-center rounded-full border border-default-300 text-default-700 hover:bg-default-50 hover:border-default-400 focus:outline-hidden">
                    <Icon icon="download" className="text-xl" />
                    <span
                      className="hs-tooltip-content hs-tooltip-shown:opacity-100 hs-tooltip-shown:visible opacity-0 transition-opacity inline-block absolute invisible z-10 py-1 px-2 bg-default-800 border border-tooltip-line text-xs font-medium text-body-bg rounded-md shadow-2xs"
                      role="tooltip"
                    >
                      Download
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="p-1.25 grid md:grid-cols-2 grid-cols-1 gap-1.25">
            {ordersStatsData.map(({ value, valuePrefix, valueSuffix, percentage, icon, iconClassName, progress, title }, index) => (
              <div className="card rounded-none border shadow-none border-dashed border-default-300 mb-0" key={index}>
                <div className="card-body">
                  <div className="mb-5 flex justify-between items-center">
                    <h5 className="text-lg">
                      {' '}
                      {valuePrefix && valuePrefix}
                      {value.toLocaleString()}
                      {valueSuffix && <small className="fs-6"> {valueSuffix}</small>}
                    </h5>
                    <span className="flex gap-1">
                      {percentage}% <Icon icon={icon} className={iconClassName} />
                    </span>
                  </div>
                  <p className="text-default-400 mb-2.5">
                    <span>{title}</span>
                  </p>
                  <div className="w-full bg-default-200 rounded-full h-1.25 mb-1.25">
                    <div className="bg-secondary h-1.25 rounded-full" role="progressbar" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center my-5">
            <Link to="/apps/chat" className="underline font-semibold flex gap-1 justify-center items-center hover:text-primary link-offset-3">
              {' '}
              View all Reports <Icon icon="send-2" />{' '}
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default OrdersStatics
