import { BasicGaugeEChart } from './GaugeChart'
import { MultiGaugeChart } from './GaugeChart'
import { MultiRingGaugeChart } from './GaugeChart'
import { RingGaugeChart } from './GaugeChart'
import { SpeedStageGaugeChart } from './GaugeChart'
import { TemperatureChart } from './GaugeChart'







const Gauges = () => {
  return (
    <>
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Basic Gauge Chart</h4>
        </div>
        <div className="card-body">
          <BasicGaugeEChart />
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Speed Stage Gauge Chart</h4>
        </div>
        <div className="card-body">
          <SpeedStageGaugeChart />
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Ring Gauge Chart</h4>
        </div>
        <div className="card-body">
          <RingGaugeChart />
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Temperature Chart</h4>
        </div>
        <div className="card-body">
          <TemperatureChart />
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Multi Ring Gauge Chart</h4>
        </div>
        <div className="card-body">
          <MultiRingGaugeChart />
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Multi Gauge Chart</h4>
        </div>
        <div className="card-body">
          <MultiGaugeChart />
        </div>
      </div>
    </>
  )
}

export default Gauges
