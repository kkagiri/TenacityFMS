import { CountUp } from '@/components/wrappers/CountUp'
import Icon from '@/components/wrappers/Icon'

const Widget2 = () => {
  return (
    <>
      <div className="card">
        <div className="card-body">
          <a href="" className="text-default-400 float-end -mt-1.25 text-xl">
            <Icon icon="external-link"></Icon>
          </a>
          <h5 title="Number of Tasks">My Tasks</h5>
          <div className="flex items-center gap-2.5 my-5">
            <div>
              <span className="size-9 bg-light rounded-full flex justify-center items-center">
                <Icon icon="checklist" className="size-5.5" />
              </span>
            </div>
            <h3 className="text-xl">
              <CountUp start={0} end={124} duration={1} />
            </h3>
            <span className="badge bg-primary/15 text-primary font-medium text-xs ms-auto">+3 New</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-primary">
                <Icon icon="point-filled" />
              </span>
              <span className="text-nowrap text-muted">Total Tasks</span>
            </div>
            <span>
              <b>12,450</b>
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <a href="" className="text-default-400 float-end -mt-1.25 text-xl">
            <Icon icon="external-link"></Icon>
          </a>
          <h5 title="Number of Messages">Messages</h5>
          <div className="flex items-center gap-2.5 my-5">
            <div>
              <span className="size-9 flex justify-center items-center text-white bg-purple rounded-full">
                <Icon icon="message-circle" className="size-5.5"></Icon>
              </span>
            </div>
            <h3 className="text-xl">
              <CountUp start={0} end={69.5} duration={1} decimals={1} suffix="k" />
            </h3>
            <span className="badge bg-secondary/15 text-secondary font-medium text-xs ms-auto">+5 New</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-secondary">
                <Icon icon="point-filled"></Icon>
              </span>
              <span className="text-nowrap text-muted">Total Messages</span>
            </div>
            <span>
              <b>32.1M</b>
            </span>
          </div>
        </div>
      </div>

      <div className="card text-white bg-primary border-0">
        <div className="card-body">
          <a href="" className="text-white-50 float-end mt-n1 text-xl">
            <Icon icon="external-link"></Icon>
          </a>
          <h5 title="Pending Approvals">Approvals</h5>
          <div className="flex items-center gap-2.5 my-5">
            <div>
              <span className="size-9 flex justify-center items-center bg-white/20 rounded-full">
                <Icon icon="file-check" className="size-5.5" />
              </span>
            </div>
            <h3 className="text-xl">
              <CountUp start={0} end={32} duration={1} />
            </h3>
          </div>
          <p>
            <span className="text-nowrap text-white text-opacity-75">Total Approvals:</span>
            <span className="float-end">
              <b>
                <CountUp start={0} end={1479} duration={1} decimals={0} />
              </b>
            </span>
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <a href="" className="text-default-400 float-end -mt-1.25 text-xl">
            <Icon icon="external-link"></Icon>
          </a>
          <h5 title="Total Clients">Clients</h5>
          <div className="flex items-center gap-2.5 my-5">
            <div>
              <span className="size-9 flex justify-center items-center text-white bg-info rounded-full">
                <Icon icon="users" className="size-5.5" />
              </span>
            </div>
            <h3 className="text-xl">
              <CountUp start={0} end={184} duration={1} />
            </h3>
            <span className="badge bg-secondary/15 text-secondary font-medium text-xs ms-auto">+4 New</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-secondary">
                <Icon icon="point-filled"></Icon>
              </span>

              <span className="text-nowrap text-muted">Total Clients</span>
            </div>
            <span>
              <b>9,835</b>
            </span>
          </div>
        </div>
      </div>

      <div className="card bg-danger/10 border-0">
        <div className="card-body">
          <a href="" className="text-default-400 float-end -mt-1.25 text-xl">
            <Icon icon="external-link"></Icon>
          </a>
          <h5 title="Revenue Generated">Revenue</h5>
          <div className="flex items-center gap-2.5 my-5">
            <div>
              <span className="size-9 flex justify-center items-center text-white bg-danger/90 rounded-full">
                <Icon icon="credit-card" className="size-5.5"></Icon>
              </span>
            </div>
            <h3 className="text-xl">
              $<CountUp start={0} end={125.5} duration={1} decimals={1} suffix="k" />
            </h3>
            <span className="badge bg-danger/15 text-danger font-medium text-xs ms-auto">+1.5%</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-primary">
                <Icon icon="point-filled"></Icon>
              </span>
              <span className="text-nowrap text-muted">Total Revenue</span>
            </div>
            <span>
              <b>$12.5M</b>
            </span>
          </div>
        </div>
      </div>
    </>
  )
}

export default Widget2
