import PageBreadcrumb from '@/components/PageBreadcrumb'
import { BasicRadialBarChart, CircleAngleRadialBarChart, GradientRadialBarChart, ImageRadialBarChart, MultipleRadialBars, SemiCircleGaugeChart, StrokedRadialBarChart } from './components/Radialbar'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="RadialBar Apexchart" subtitle="Charts" />
      <div className="container-fluid">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Basic RadialBar Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <BasicRadialBarChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Multiple RadialBars</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <MultipleRadialBars />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Circle Chart - Custom Angle</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <CircleAngleRadialBarChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Circle Chart with Image</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <ImageRadialBarChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Stroked Circular Guage</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <StrokedRadialBarChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Gradient Circular Chart</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <GradientRadialBarChart />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h4 className="card-title">Semi Circle Gauge</h4>
            </div>
            <div className="card-body">
              <div dir="ltr">
                <SemiCircleGaugeChart />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
