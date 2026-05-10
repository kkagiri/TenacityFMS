import starbucks from '@/assets/images/logos/starbucks.svg'
import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import Activity from './components/Activity'
import Comments from './components/Comments'
import Sidebar from './components/Sidebar'
import TaskList from './components/TaskList'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Project Overview" subtitle="Projects" />
      <div className="container">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-base lg:gap-0">
          <div className="lg:col-span-3">
            <div className="card h-full">
              <div className="card-header flex flex-wrap items-start gap-base p-7.5">
                <div className="bg-light me-5 flex size-20 items-center justify-center rounded">
                  <img src={starbucks} className="h-12" alt="Brand-img" />
                </div>

                <div>
                  <h3 className="mb-1.25 flex items-center text-lg">Starbucks - AI Analytics Dashboard</h3>
                  <p className="text-default-400 text-2xs mb-2.5">Updated 5 minutes ago</p>
                  <span className="badge badge-label text-2xs text-success bg-success/15">In Progress</span>
                </div>

                <div className="ms-auto">
                  <Link to="" className="btn bg-light hover:text-primary">
                    <Icon icon="pencil" /> Edit
                  </Link>
                </div>
              </div>

              <div className="card-body px-7.5">
                <div className="mb-7.5">
                  <h5 className="mb-2.5">Project Description:</h5>
                  <p className="text-default-400 mb-4">This dashboard provides AI-powered insights and analytics for Starbucks business data. It includes sales performance, customer behavior, and predictive trends to assist in data-driven decision-making.</p>

                  <p className="text-default-400 mb-4">
                    Customizable reports and role-based dashboards ensure relevant insights for marketing teams, financial analysts, and executive decision-makers. The system is built with scalability and responsiveness in mind, supporting both desktop and mobile views for
                    seamless access.
                  </p>
                </div>

                <div className="mb-7.5">
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    <div>
                      <h6 className="text-xs text-default-400 mb-1.25 uppercase">Created Date:</h6>
                      <p className="font-medium">March 15, 2025</p>
                    </div>

                    <div>
                      <h6 className="text-xs text-default-400 mb-1.25 uppercase">Deadline:</h6>
                      <p className="font-medium">June 30, 2025</p>
                    </div>

                    <div>
                      <h6 className="text-xs text-default-400 mb-1.25 uppercase">Created By:</h6>
                      <p className="font-medium">John Smith</p>
                    </div>

                    <div>
                      <h6 className="text-xs text-default-400 mb-1.25 uppercase">Client Name:</h6>
                      <p className="font-medium">Starbucks Corporation</p>
                    </div>
                  </div>
                </div>

                <div className="border-default-300 border-b">
                  <nav className="flex gap-x-1" aria-label="Tabs" role="tablist" aria-orientation="horizontal">
                    <button
                      type="button"
                      className="hs-tab-active:font-semibold hs-tab-active:border-primary hs-tab-active:text-primary hover:text-primary focus:text-primary active inline-flex items-center gap-x-2 border-b border-transparent px-4 py-2 text-sm whitespace-nowrap focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
                      id="comments"
                      aria-selected="true"
                      data-hs-tab="#comments-tab"
                      aria-controls="comments-tab"
                      role="tab"
                    >
                      <Icon icon="message-circle" className="me-md-1 text-base align-middle"></Icon>
                      <span className="hidden align-middle md:inline-block">Comments</span>
                    </button>
                    <button
                      type="button"
                      className="hs-tab-active:font-semibold hs-tab-active:border-primary hs-tab-active:text-primary hover:text-primary focus:text-primary inline-flex items-center gap-x-2 border-b border-transparent px-4 py-2 text-sm whitespace-nowrap focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
                      id="tasks"
                      aria-selected="false"
                      data-hs-tab="#tasks-tab"
                      aria-controls="tasks-tab"
                      role="tab"
                    >
                      <Icon icon="list-check" className="me-md-1 text-base align-middle"></Icon>
                      <span className="hidden align-middle md:inline-block">Task List</span>
                    </button>
                    <button
                      type="button"
                      className="hs-tab-active:font-semibold hs-tab-active:border-primary hs-tab-active:text-primary hover:text-primary focus:text-primary inline-flex items-center gap-x-2 border-b border-transparent px-4 py-2 text-sm whitespace-nowrap focus:outline-hidden disabled:pointer-events-none disabled:opacity-50"
                      id="activity"
                      aria-selected="false"
                      data-hs-tab="#activity-tab"
                      aria-controls="activity-tab"
                      role="tab"
                    >
                      <Icon icon="activity" className="me-md-1 text-base align-middle"></Icon>
                      <span className="hidden align-middle md:inline-block">Activity</span>
                    </button>
                  </nav>
                </div>

                <div className="mt-5">
                  <div id="comments-tab" role="tabpanel" aria-labelledby="comments">
                    <Comments />
                  </div>

                  <div id="tasks-tab" className="hidden" role="tabpanel" aria-labelledby="tasks">
                    <TaskList />
                  </div>

                  <div id="activity-tab" className="hidden" role="tabpanel" aria-labelledby="activity">
                    <Activity />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Sidebar />
        </div>
      </div>
    </>
  )
}

export default Page
