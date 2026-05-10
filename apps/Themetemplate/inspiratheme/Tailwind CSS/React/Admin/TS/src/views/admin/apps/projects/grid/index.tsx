import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import ProjectCard from './components/ProjectCard'
import { projectData } from './components/data'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Projects" subtitle="Apps" />

      <div className="card mb-base">
        <div className="card-body bg-light/20">
          <div className="grid grid-cols-1 items-center lg:grid-cols-3 gap-base">
            <div>
              <div className="input-icon-group">
                <Icon icon="search" className="input-icon" />
                <input type="text" className="form-input" placeholder="Search project name..." />
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center gap-2.5 md:flex-nowrap">
                <div className="flex flex-wrap items-center gap-2.5 md:flex-nowrap">
                  <div className="items-center gap-2.5 md:flex">
                    <span className="font-semibold me-2.5">Filter By:</span>

                    <div className="input-icon-group">
                      <Icon icon="activity" className="input-icon" />
                      <select className="form-select">
                        <option>Status</option>
                        <option value="On Track">On Track</option>
                        <option value="Delayed">Delayed</option>
                        <option value="At Risk">At Risk</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div className="input-icon-group">
                    <Icon icon="users" className="input-icon" />
                    <select className="form-select">
                      <option>Team</option>
                      <option value="Design">Design</option>
                      <option value="Development">Development</option>
                      <option value="Marketing">Marketing</option>
                      <option value="QA">QA</option>
                    </select>
                  </div>

                  <div className="input-icon-group">
                    <Icon icon="calendar-clock" className="input-icon" />
                    <select className="form-select">
                      <option>Deadline</option>
                      <option value="This Week">This Week</option>
                      <option value="This Month">This Month</option>
                      <option value="Next Month">Next Month</option>
                      <option value="No Deadline">No Deadline</option>
                    </select>
                  </div>

                  <button type="submit" className="btn bg-secondary text-white hover:bg-secondary-hover">
                    Apply
                  </button>
                </div>

                <div className="md:ms-auto">
                  <nav className="flex items-center gap-x-1">
                    <Link to="/apps/projects/grid" className="btn bg-primary btn-icon text-white hover:bg-primary-hover">
                      <Icon icon="category" className="text-lg" />
                    </Link>

                    <Link to="/apps/projects/list" className="btn bg-primary/15 text-primary btn-icon hover:bg-primary hover:text-white">
                      <Icon icon="list-check" className="text-lg" />
                    </Link>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-base lg:grid-cols-4">
        {projectData.map((project, idx) => (
          <ProjectCard key={idx} project={project} />
        ))}
      </div>

      <div className="mt-5">
        <nav className="mx-auto flex items-center justify-center gap-1.5" aria-label="Pagination">
          <button type="button" className="btn btn-icon bg-card border-default-300 hover:bg-default-50 hover:text-primary rounded-full" aria-label="Previous">
            <span>«</span>
          </button>

          <button type="button" className="btn btn-icon bg-primary rounded-full text-white">
            1
          </button>

          <button type="button" className="btn btn-icon bg-card hover:bg-default-50 border-default-300 hover:text-primary rounded-full">
            2
          </button>

          <button type="button" className="btn btn-icon bg-card hover:bg-default-50 border-default-300 hover:text-primary rounded-full">
            3
          </button>

          <button type="button" className="btn btn-icon bg-card hover:bg-default-50 border-default-300 hover:text-primary rounded-full">
            4
          </button>

          <button type="button" className="btn btn-icon bg-card hover:bg-default-50 border-default-300 hover:text-primary rounded-full">
            5
          </button>

          <button type="button" className="btn btn-icon bg-card border-default-300 hover:bg-default-50 hover:text-primary rounded-full" aria-label="Next">
            <span>»</span>
          </button>
        </nav>
      </div>
    </>
  )
}

export default Page
