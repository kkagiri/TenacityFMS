import EChart from '@/components/wrappers/EChart'
import Icon from '@/components/wrappers/Icon'
import { getColor } from '@/utils/helpers'
import { LineChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { Button, Card, CardBody, CardHeader, CardTitle, Col, Nav, NavItem, NavLink, ProgressBar, Row } from 'react-bootstrap'
import { Link } from 'react-router'
import { ordersStatsData } from './data'
export const getOrdersStatsOptions = () => {
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
      backgroundColor: getColor('secondary-bg'),
      borderColor: getColor('border-color'),
      textStyle: {
        color: getColor('light-text-emphasis'),
      },
      borderWidth: 1,
      transitionDuration: 0.125,
      axisPointer: {
        type: 'none',
      },
      shadowBlur: 2,
      shadowColor: 'rgba(76, 76, 92, 0.15)',
      shadowOffsetX: 0,
      shadowOffsetY: 1,
      formatter: function (params) {
        const rawDate = new Date()
        rawDate.setDate(today.getDate() - 14 + params[0].dataIndex)
        const formattedDate = rawDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
        const seriesInfo = params
          .map((item) => {
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
          color: getColor('border-color'),
        },
      },
      axisLabel: {
        show: true,
        color: getColor('secondary-color'),
      },
      splitLine: {
        lineStyle: {
          color: getColor('border-color'),
          type: 'dashed',
        },
      },
    },
    yAxis: {
      axisLine: {
        lineStyle: {
          type: 'dashed',
          color: getColor('border-color'),
        },
      },
      axisLabel: {
        show: true,
        color: getColor('secondary-color'),
      },
      splitLine: {
        show: false,
        lineStyle: {
          color: getColor('border-color'),
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
    <Card>
      <CardHeader className="border-dashed card-tabs d-flex align-items-center">
        <div className="flex-grow-1">
          <CardTitle as="h4">Orders Statics</CardTitle>
        </div>
        <Nav variant="tabs" defaultActiveKey="monthly-ct" className="card-header-tabs nav-bordered">
          <NavItem>
            <NavLink eventKey="today-ct">
              <Icon icon="home" className="d-md-none d-block" />
              <span className="d-none d-md-block">Today</span>
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink eventKey="monthly-ct">
              <Icon icon="user-circle" className="d-md-none d-block" />
              <span className="d-none d-md-block">Monthly</span>
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink eventKey="annual-ct">
              <Icon icon="settings" className="d-md-none d-block" />
              <span className="d-none d-md-block">Annual</span>
            </NavLink>
          </NavItem>
        </Nav>
      </CardHeader>
      <CardBody className="p-0">
        <Row className="g-0">
          <Col xxl={8} className="border-end border-dashed">
            <EChart
              extensions={[LineChart, TooltipComponent, CanvasRenderer]}
              getOptions={getOrdersStatsOptions}
              style={{
                height: 405,
              }}
            />
          </Col>
          <Col xxl={4}>
            <div className="p-3 bg-light-subtle border-bottom border-dashed">
              <Row>
                <Col>
                  <h4 className="fs-sm mb-1">Would you like the full report?</h4>
                  <small className="text-muted fs-xs mb-0">All 120 orders have been successfully delivered</small>
                </Col>
                <Col xs="auto" className="align-self-center">
                  <Button variant="default" size="sm" className="rounded-circle btn-icon" data-bs-toggle="tooltip" data-bs-placement="top" title="Download">
                    <Icon icon="download" className="fs-xl" />
                  </Button>
                </Col>
              </Row>
            </div>
            <Row xs={1} md={2} xxl={2} className="g-1 p-1">
              {ordersStatsData.map(({ value, valuePrefix, valueSuffix, percentage, icon, iconClassName, progress, title }, index) => (
                <Col key={index}>
                  <Card className="rounded-0 border shadow-none border-dashed mb-0">
                    <CardBody>
                      <div className="mb-3 d-flex justify-content-between align-items-center">
                        <h5 className="fs-xl mb-0">
                          {valuePrefix && valuePrefix}
                          {value.toLocaleString()}
                          {valueSuffix && <small className="fs-6"> {valueSuffix}</small>}
                        </h5>
                        <span>
                          {percentage}% <Icon icon={icon} className={iconClassName} />
                        </span>
                      </div>
                      <p className="text-muted mb-2">
                        <span>{title}</span>
                      </p>
                      <ProgressBar
                        now={progress}
                        variant="secondary"
                        style={{
                          height: '0.25rem',
                        }}
                        aria-label={title}
                      />
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>
            <div className="text-center my-3">
              <Link to="/apps/chat" className="link-reset text-decoration-underline fw-semibold link-offset-3">
                View all Reports <Icon icon="send-2" />
              </Link>
            </div>
          </Col>
        </Row>
      </CardBody>
    </Card>
  )
}
export default OrdersStatics
