import Discussions from './components/Discussions'
import ProjectPerformance from './components/ProjectPerformance'
import ProjectUpdates from './components/ProjectUpdates'
import QuarterlyReports from './components/QuarterlyReports'
import StatCards from './components/StatCards'
import WelcomeRevenueProgress from './components/WelcomeRevenueProgress'


const Page = () => {
  return (
    <>
      <div className="card my-5">
        <WelcomeRevenueProgress />
      </div>
      <StatCards />
      <div className="grid xl:grid-cols-3 grid-cols-1 gap-base">
        <div className="flex flex-col gap-base">
          <QuarterlyReports />
          <ProjectPerformance />
        </div>
        <ProjectUpdates />
        <Discussions />
      </div>
    </>
  )
}

export default Page
