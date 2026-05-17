import Icon from '@/components/wrappers/Icon'

import user5 from '@/assets/images/users/user-5.jpg'
import user6 from '@/assets/images/users/user-6.jpg'
import user7 from '@/assets/images/users/user-7.jpg'
import user8 from '@/assets/images/users/user-8.jpg'
import user9 from '@/assets/images/users/user-9.jpg'

const TodaySchedule = () => {
  return (
    <div className="card">
      <div className="card-header justify-content-between">
        <h4 className="card-title">Today's Schedule</h4>
        <a href="" className="text-primary font-semibold hover:text-primary-hover flex items-center">
          <Icon icon="calendar" className="me-1" />
          <span>Invite</span>
        </a>
      </div>

      <div className="card-body">
        <div className="pb-2.5 border-b border-light border-dashed">
          <div className="mb-2.5">
            <p className="mb-1.25 text-truncate text-sm font-medium">Design Review Meeting</p>
            <span className="text-warning text-xs">30 minute session with UI/UX team</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center -space-x-2 transition-all duration-300">
              <div>
                <img src={user5} alt="Liam Carter" className="transitio-all size-6 rounded-full duration-200 hover:-translate-y-1" />
              </div>
              <div>
                <img src={user6} alt="Zoe Miles" className="transitio-all size-6 rounded-full duration-200 hover:-translate-y-1" />
              </div>
              <div className="">
                <span className="size-6 flex justify-center items-center rounded-full bg-primary/15 text-primary font-bold"> D </span>
              </div>
            </div>
            <button type="button" className="btn size-8 bg-secondary/15 text-secondary hover:bg-secondary hover:text-white rounded-full">
              <Icon icon="brand-figma" className="text-lg"></Icon>
            </button>
          </div>
        </div>

        <div className="py-2.5 border-b border-light border-dashed">
          <div className="mb-2.5">
            <p className="mb-1.25 text-truncate text-sm font-medium">Sprint Planning Session</p>
            <span className="text-success text-xs">1 hour agile team meeting</span>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center -space-x-2 transition-all duration-300">
              <div>
                <img src={user7} alt="Ava Lee" className="transitio-all size-6 rounded-full duration-200 hover:-translate-y-1" />
              </div>
              <div>
                <img src={user8} alt="Ethan King" className="transitio-all size-6 rounded-full duration-200 hover:-translate-y-1" />
              </div>
              <div>
                <img src={user9} alt="Lucas White" className="transitio-all size-6 rounded-full duration-200 hover:-translate-y-1" />
              </div>
            </div>
            <button type="button" className="btn size-8 bg-secondary/15 text-secondary hover:bg-secondary hover:text-white rounded-full">
              <Icon icon="calendar-event" className="text-lg"></Icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TodaySchedule
