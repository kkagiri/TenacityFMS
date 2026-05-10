import Icon from '@/components/wrappers/Icon'
import { Nav, NavItem, NavLink, TabContainer, TabContent, TabPane } from 'react-bootstrap'
import Activity from './Activity'
import Comments from './Comments'
import TaskList from './TaskList'
const ProjectTabs = () => {
  return (
    <TabContainer defaultActiveKey="0">
      <Nav as="ul" className="nav nav-tabs nav-bordered mb-3" role="tablist">
        <NavItem>
          <NavLink eventKey="0" role="tab">
            <Icon icon="message-circle" className="fs-lg me-md-1 align-middle" />
            <span className="d-none d-md-inline-block align-middle">Comments</span>
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink eventKey="1" role="tab">
            <Icon icon="list-check" className="fs-lg me-md-1 align-middle" />
            <span className="d-none d-md-inline-block align-middle">Task List</span>
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink eventKey="2" role="tab">
            <Icon icon="activity" className="fs-lg me-md-1 align-middle" />
            <span className="d-none d-md-inline-block align-middle">Activity</span>
          </NavLink>
        </NavItem>
      </Nav>
      <TabContent>
        <TabPane eventKey="0" className="fade" id="comments" role="tabpanel">
          <Comments />
        </TabPane>

        <TabPane eventKey="1" className="fade" id="tasks" role="tabpanel">
          <TaskList />
        </TabPane>

        <TabPane eventKey="2" className="fade" id="activity" role="tabpanel">
          <Activity />
        </TabPane>
      </TabContent>
    </TabContainer>
  )
}
export default ProjectTabs
