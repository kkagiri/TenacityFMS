import { Card, CardBody, CardHeader } from 'react-bootstrap'
const Skill = () => {
  return (
    <>
      <Card>
        <CardHeader>
          <h4 className="card-title">Skills</h4>
        </CardHeader>
        <CardBody>
          <div className="d-flex flex-wrap gap-1">
            <a className="btn btn-light btn-sm" href="#">
              Product Design
            </a>
            <a className="btn btn-light btn-sm" href="#">
              UI/UX
            </a>
            <a className="btn btn-light btn-sm" href="#">
              Tailwind CSS
            </a>
            <a className="btn btn-light btn-sm" href="#">
              Bootstrap
            </a>
            <a className="btn btn-light btn-sm" href="#">
              React.js
            </a>
            <a className="btn btn-light btn-sm" href="#">
              Next.js
            </a>
            <a className="btn btn-light btn-sm" href="#">
              Vue.js
            </a>
            <a className="btn btn-light btn-sm" href="#">
              Figma
            </a>
            <a className="btn btn-light btn-sm" href="#">
              Design Systems
            </a>
            <a className="btn btn-light btn-sm" href="#">
              Template Authoring
            </a>
            <a className="btn btn-light btn-sm" href="#">
              Responsive Design
            </a>
            <a className="btn btn-light btn-sm" href="#">
              Component Libraries
            </a>
          </div>
        </CardBody>
      </Card>
    </>
  )
}
export default Skill
