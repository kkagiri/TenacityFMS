import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { cn, toPascalCase } from '@/utils/helpers'
import { Link } from 'react-router'
import { VoteListItemType, voteListData } from './data'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Vote List" subtitle="Apps" />
      <div className="container">
        <div className="card">
          <div className="card-header">
            <div className="input-icon-group">
              <Icon icon="search" className="input-icon" />
              <input data-table-search type="text" placeholder="Search topics..." className="form-input" />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold me-3">Filter By:</span>
              <div className="input-icon-group">
                <Icon icon="filter-2" className="input-icon" />
                <select className="form-select">
                  <option>Sort By</option>
                  <option value="North America">Latest</option>
                  <option value="Europe">Popular</option>
                  <option value="Asia">Low Votes</option>
                  <option value="Africa">High Votes</option>
                </select>
              </div>
              <div className="input-icon-group">
                <Icon icon="circle-check" className="input-icon" />
                <select className="form-select">
                  <option>Vote Status</option>
                  <option value="Voted">Voted</option>
                  <option value="Not Voted">Not Voted</option>
                  <option value="Pending">Pending</option>
                  <option value="Disqualified">Disqualified</option>
                </select>
              </div>
              <button type="submit" className="btn bg-success text-white hover:bg-success-hover">
                Add New Topics
              </button>
            </div>
          </div>
          <div className="card-body p-0">
            <div>
              {voteListData.map((item, idx) => (
                <div className={cn('px-7.5 py-5', { 'border-b border-dashed border-default-300': idx !== voteListData.length - 1 })} key={idx}>
                  <VoteListItem item={item} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Page

const VoteListItem = ({ item }: { item: VoteListItemType }) => {
  return (
    <div className="flex items-center gap-7.5">
      <div>
        <div className="flex flex-col items-stretch gap-1.5 text-center">
          <button type="button" className="btn p-0">
            <Icon icon="chevron-up" className={cn('text-xl', item.userVote === 'up' ? 'text-danger' : 'text-primary')} />
          </button>
          <h5 className="text-base font-bold">{item.votes}</h5>
          <button type="button" className="btn p-0">
            <Icon icon="chevron-down" className={cn('text-xl', item.userVote === 'down' ? 'text-danger' : 'text-primary')} />
          </button>
        </div>
      </div>
      <div className={item.userVote ? 'grow' : ''}>
        <h4 className="text-md mb-1.25">
          <Link to="" className="hover:text-primary">
            &nbsp;
            {item.title}
          </Link>
        </h4>
        <p className="text-default-400 mb-2.5 text-sm">{item.description}</p>
        <p className="text-default-400 mb-1.25 flex flex-wrap items-center gap-base">
          <span className="flex items-center gap-1.25">
            <img src={item.user.image} alt="avatar-7" className="size-6 rounded-full" />
            <Link to="" className="hover:text-primary font-semibold">
              &nbsp;
              {item.user.name}
            </Link>
          </span>
          <span className="flex items-center gap-1">
            <Icon icon="calendar" />
            <span>Posted on: {item.postedOn}</span>
          </span>
          <span className="flex items-center gap-1">
            <Icon icon="tag" />
            <span className="badge bg-light text-primary">{item.category}</span>
          </span>
          <span className="flex items-center gap-1">
            <Icon icon="messages" />
            <Link to="" className="hover:text-primary text-sm">
              Comments: {item.comments}
            </Link>
          </span>
          <span className="flex items-center gap-1">
            <Icon icon="clock" />
            Ends in: {item.endsIn}
          </span>
          <span className="flex items-center gap-1">
            <Icon icon="users" />
            Votes: {item.votes}
          </span>
          <span className="flex items-center gap-1.5">
            <Icon icon="lock" />
            <span className={cn('badge text-white', item.status === 'ending-soon' ? 'bg-info' : item.status === 'closed' ? 'bg-warning' : 'bg-success')}>{toPascalCase(item.status)}</span>
          </span>
        </p>
      </div>

      {item.userVote && (
        <span className="text-success/25 ms-auto text-4xl">
          <Icon icon="checks" />
        </span>
      )}
    </div>
  )
}
