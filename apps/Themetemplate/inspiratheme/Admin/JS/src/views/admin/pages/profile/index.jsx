import profile from '@/assets/images/profile-bg.jpg'
import user1 from '@/assets/images/users/user-1.jpg'
import Icon from '@/components/wrappers/Icon'
import { META_DATA } from '@/config/constants'
import { Card, CardBody, CardHeader, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Row } from 'react-bootstrap'
import BlogCard from './components/BlogCard'
import { blogData, statisticsData } from './components/data'
import PersonalInformation from './components/PersonalInformation'
import Skill from './components/Skill'
import SocialFeed from './components/SocialFeed'
import TaskOverview from './components/TaskOverview'
const Page = () => {
  return (
    <>
      <Row>
        <Col xs={12}>
          <article className="card card-out-of-container border-top-0">
            <div
              className="position-relative card-side-img overflow-hidden"
              style={{
                height: 250,
                backgroundImage: `url(${profile})`,
              }}
            >
              <div className="p-4 card-img-overlay rounded-start-0 auth-overlay d-flex align-items-center justify-content-center">
                <h3 className="text-white mb-0 fst-italic">"Designing the future, one template at a time"</h3>
              </div>
            </div>

            <CardBody>
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex justify-content-start align-items-center gap-3">
                  <div className="avatar avatar-xxl">
                    <img src={user1} alt="avatar-2" className="img-fluid img-thumbnail rounded-circle" />
                  </div>
                  <div>
                    <h4 className="text-nowrap fw-bold mb-1">{META_DATA.username}</h4>
                    <p className="text-muted mb-1">Product Designer</p>
                    <span className="badge badge-soft-primary fw-medium fs-xs ms-auto">Author</span>
                  </div>
                </div>
                <div className="d-flex gap-2">
                  <a className="btn btn-outline-primary" href="#!">
                    Follow
                  </a>
                  <a className="btn btn-primary" href="#!">
                    Message
                  </a>
                  <Dropdown>
                    <DropdownToggle type="button" className="btn-icon btn-dark drop-arrow-none">
                      <Icon icon="dots" className="fs-24" />
                    </DropdownToggle>
                    <DropdownMenu>
                      <DropdownItem>Edit Profile</DropdownItem>
                      <DropdownItem className="text-danger">Report</DropdownItem>
                    </DropdownMenu>
                  </Dropdown>
                </div>
              </div>
            </CardBody>
          </article>
        </Col>
      </Row>

      <Row>
        <Col xl={4}>
          <PersonalInformation />

          <Skill />

          <SocialFeed />
        </Col>

        <Col xl={8}>
          <Row className="row-cols-xxl-4 row-cols-md-2 row-cols-1 align-items-center">
            {statisticsData.map((item, index) => (
              <Col key={index}>
                <Card>
                  <CardBody>
                    <a href="" className="text-muted float-end mt-n1 fs-xl">
                      <Icon icon="external-link"></Icon>
                    </a>
                    <h5 title={item.title}>{item.title}</h5>
                    <div className="d-flex align-items-center gap-2 my-3">
                      <div className="avatar-md flex-shrink-0">
                        <span className={`avatar-title text-bg-${item.variant} rounded-circle fs-22`}>
                          <Icon icon={item.icon} />
                        </span>
                      </div>
                      <h3 className="mb-0">
                        {item.count.prefix}
                        {item.count.value}
                        {item.count.suffix}
                      </h3>
                      <span className={`badge badge-soft-${item.variant} fw-medium ms-2 fs-xs ms-auto`}>{item.badge}</span>
                    </div>
                    <p className="mb-0">
                      <span className={`text-${item.variant}`}>
                        <Icon icon="circle" className="align-middle"></Icon>
                      </span>
                      <span className="text-nowrap text-muted">{item.description}</span>
                      <span className="float-end">
                        <b>
                          {item.totalCount.prefix}
                          {item.totalCount.value}
                          {item.totalCount.suffix}
                        </b>
                      </span>
                    </p>
                  </CardBody>
                </Card>
              </Col>
            ))}
          </Row>

          <Card>
            <CardHeader>
              <h4 className="card-title mb-0">About Me</h4>
            </CardHeader>
            <CardBody>
              <p>
                I'm a Product Designer and template author passionate about crafting clean, scalable, and high-performing UI solutions. With a focus on frontend technologies and modern design systems, I create user-centric digital products that are both functional and visually
                appealing.
              </p>
              <p className="mb-0">
                As a template creator, I specialize in building developer-friendly UI kits and dashboards using frameworks like Tailwind CSS, Bootstrap, React, Next.js, Vue, and Laravel. My work powers countless web apps, helping developers save time and build faster.
              </p>
              <div className="mt-3">
                <h5 className="mb-2">My Approach :</h5>
                <p className="mb-0">
                  I take a user-first approach to design—blending thoughtful UX with clean code. From wireframes to fully responsive templates, I focus on creating intuitive and aesthetic experiences. Whether you're launching a SaaS dashboard, admin panel, or marketing site, I
                  strive to deliver pixel-perfect results that elevate your product.
                </p>
              </div>
            </CardBody>
          </Card>

          <TaskOverview />

          <h4 className="my-4">My Blog Posts</h4>

          <Row>
            {blogData.map((blog, index) => (
              <Col key={index} xl={4} md={6}>
                <BlogCard blog={blog} />
              </Col>
            ))}
          </Row>
        </Col>
      </Row>
    </>
  )
}
export default Page
