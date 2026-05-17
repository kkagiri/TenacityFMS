import { BasicBarChart } from './BarChart'
import { GradientBarChart } from './BarChart'
import { HoriBarChart } from './BarChart'
import { HorizontalStackedBar } from './BarChart'
import { MixdedBarChart } from './BarChart'
import { NegativeChart } from './BarChart'
import { ProgressBar } from './BarChart'
import { RaceBarChart } from './BarChart'
import { SeriesBarChart } from './BarChart'
import { StackedBarChart } from './BarChart'
import { TimelineBarChart } from './BarChart'
import { TwobarChart } from './BarChart'













const Charts = () => {
  return (
    <>
      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Basic Bar Chart</h4>
        </div>
        <div className="card-body">
          <BasicBarChart />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Two Bar Chart</h4>
        </div>
        <div className="card-body">
          <TwobarChart />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Progress Bar Chart</h4>
        </div>
        <div className="card-body">
          <ProgressBar />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Horizontal Bar Chart</h4>
        </div>
        <div className="card-body">
          <HoriBarChart />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Negative Chart</h4>
        </div>
        <div className="card-body">
          <NegativeChart />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Bar Chart with Series</h4>
        </div>
        <div className="card-body">
          <SeriesBarChart />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Stacked Bar</h4>
        </div>
        <div className="card-body">
          <StackedBarChart />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Horizontal Stacked Bar</h4>
        </div>
        <div className="card-body">
          <HorizontalStackedBar />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Bar Race Chart</h4>
        </div>
        <div className="card-body">
          <RaceBarChart />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Bar Gradient Chart</h4>
        </div>
        <div className="card-body">
          <GradientBarChart />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h4 className="card-title">Mixded Bar Chart</h4>
        </div>
        <div className="card-body">
          <MixdedBarChart />
        </div>
      </div>

      <div className="col-span-2">
        <div className="card">
          <div className="card-header">
            <h4 className="card-title">Timeline Bar Chart</h4>
          </div>
          <div className="card-body">
            <TimelineBarChart />
          </div>
        </div>
      </div>
    </>
  )
}

export default Charts
