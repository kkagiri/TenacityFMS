import PageBreadcrumb from '@/components/PageBreadcrumb'
import { Card, CardBody, CardHeader, CardTitle, Col, Container, Row } from 'react-bootstrap'
import ReactPlayer from 'react-player'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Video Player" subtitle="Plugins" />
      <Container fluid="xxl">
        <Row>
          <Col xl={6} xs={12}>
            <Card>
              <CardHeader>
                <CardTitle as="h4">Basic MP4 Video Player</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ height: 420 }}>
                  <ReactPlayer light="https://media.w3.org/2010/05/sintel/poster.png" className="plyr w-100" controls src="https://media.w3.org/2010/05/sintel/trailer_hd.mp4" />
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col xl={6} xs={12}>
            <Card>
              <CardHeader>
                <CardTitle as="h4">Autoplay (muted), Loop Video Player</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ height: 420 }}>
                  <ReactPlayer className="plyr w-100" light="https://media.w3.org/2010/05/sintel/poster.png" height={420} controls loop muted playing src="https://media.w3.org/2010/05/sintel/trailer_hd.mp4" />
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col xl={6} xs={12}>
            <Card>
              <CardHeader>
                <CardTitle as="h4">YouTube Video Player</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ height: 420 }}>
                  <ReactPlayer light="https://media.w3.org/2010/05/sintel/poster.png" className="plyr w-100" height={420} controls src="https://youtu.be/2jmiNO3jwrA?si=nJtopWJfV8xW18J6" config={{ youtube: { color: 'white' } }} />
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col xl={6} xs={12}>
            <Card>
              <CardHeader>
                <CardTitle as="h4">Vimeo Video Player</CardTitle>
              </CardHeader>
              <CardBody>
                <div style={{ height: 420 }}>
                  <ReactPlayer src="https://vimeo.com/76979871" controls className="plyr w-100 h-100" />
                </div>
              </CardBody>
            </Card>
          </Col>

          <Col xl={6}>
            <Card>
              <CardHeader>
                <CardTitle as="h4">Audio Player</CardTitle>
              </CardHeader>
              <CardBody>
                <audio className="w-100" id="player-audio" controls>
                  <source src="https://cdn.plyr.io/static/demo/Kishi_Bashi_-_It_All_Began_With_a_Burst.mp3" type="audio/mp3" />
                  <source src="https://cdn.plyr.io/static/demo/Kishi_Bashi_-_It_All_Began_With_a_Burst.ogg" type="audio/ogg" />
                </audio>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  )
}

export default Page
