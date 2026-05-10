import Quill from '@/components/wrappers/Quill'
import Flatpickr from '@/components/wrappers/Flatpickr'
import { useState } from 'react'
import { Button, Card, CardBody, CardHeader, Col, Container, Form, FormCheck, FormControl, FormLabel, FormSelect, Row } from 'react-bootstrap'
import FormCheckInput from 'react-bootstrap/esm/FormCheckInput'
import FormCheckLabel from 'react-bootstrap/esm/FormCheckLabel'


const modules = {
  toolbar: [
    [{ font: [] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ script: 'super' }, { script: 'sub' }],
    [{ header: [false, 1, 2, 3, 4, 5, 6] }],
    ['blockquote', 'code-block'],
    [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
    [{ align: [] }],
    ['link', 'image', 'video'],
    ['clean'],
  ],
}
const CreateArticle = () => {
  const [value, setValue] = useState<string>(
    `<h3>Create, manage, and publish engaging blog articles effortlessly.</h3>
      <ul>
        <li>Write and format posts with an intuitive rich-text editor.</li>
        <li>Organize articles by categories, tags, and authors for easy navigation.</li>
        <li>Built-in SEO tools to help your content rank higher on search engines.</li>
        <li>Preview articles before publishing to ensure perfect layout and style.</li>
        <li>Fully responsive design ensures your blog looks great on any device.</li>
      </ul>
      <p>
        The Blog Article module helps you create professional-looking posts quickly. Ideal for personal blogs, news platforms, or content-driven websites.
      </p>`
  )
  return (
    <Container fluid="xxl">
      <Row className="justify-content-center">
        <Col xs={12}>
          <Card>
            <CardHeader className="justify-content-between">
              <h5 className="mb-0">Create New Blog Post</h5>
              <small className="text-muted">Last saved: just now</small>
            </CardHeader>
            <CardBody>
              <Form>
                <div className="mb-3">
                  <FormLabel htmlFor="title" className="fw-semibold">
                    Post Title
                  </FormLabel>
                  <FormControl type="text" id="title" placeholder="Enter your blog title" required />
                </div>

                <div className="mb-3">
                  <FormLabel htmlFor="slug" className="fw-semibold">
                    Slug
                  </FormLabel>
                  <FormControl type="text" id="slug" placeholder="e.g. how-to-build-a-blog-with-bootstrap" />
                </div>

                <Row className="g-3">
                  <Col md={6}>
                    <FormLabel htmlFor="author" className="fw-semibold">
                      Author
                    </FormLabel>
                    <FormControl type="text" id="author" placeholder="Enter author name" />
                  </Col>
                  <Col md={6}>
                    <FormLabel htmlFor="publishDate" className="fw-semibold">
                      Publish Date & Time
                    </FormLabel>
                    <Flatpickr options={{ enableTime: true, defaultDate: new Date(), dateFormat: 'd M, Y H:i' }} type="text" className="form-control flatpickr-input" id="publishDate" />
                  </Col>
                </Row>

                <div className="mb-3 mt-3">
                  <FormLabel htmlFor="category" className="fw-semibold">
                    Category
                  </FormLabel>
                  <FormSelect id="category">
                    <option aria-selected disabled>
                      Select category
                    </option>
                    <option>Technology</option>
                    <option>Design</option>
                    <option>Development</option>
                    <option>Business</option>
                    <option>Lifestyle</option>
                  </FormSelect>
                </div>

                <div className="mb-3">
                  <FormLabel htmlFor="image" className="fw-semibold">
                    Featured Image
                  </FormLabel>
                  <FormControl type="file" id="image" />
                  <small className="text-muted">Recommended size: 1200x600px</small>
                </div>

                <div className="mb-3">
                  <FormLabel className="fw-semibold">Post Content</FormLabel>
                  <div id="snow-editor">
                    <Quill theme="snow" modules={modules} value={value} onChange={setValue} />
                  </div>
                </div>

                <div className="mb-3">
                  <FormLabel htmlFor="excerpt" className="fw-semibold">
                    Excerpt (Short Summary)
                  </FormLabel>
                  <FormControl as="textarea" id="excerpt" rows={2} placeholder="Enter a short summary for your post..."></FormControl>
                </div>

                <div className="mb-3">
                  <FormLabel htmlFor="tags" className="fw-semibold">
                    Tags
                  </FormLabel>
                  <FormControl type="text" id="tags" placeholder="e.g. bootstrap, web design, ui, frontend" />
                  <small className="text-muted">Separate tags with commas.</small>
                </div>

                <div className="border-top pt-3 mt-4">
                  <h5 className="fw-bold text-uppercase mb-3 text-muted fs-sm">SEO Settings</h5>
                  <div className="mb-3">
                    <FormLabel htmlFor="metaTitle">Meta Title</FormLabel>
                    <FormControl type="text" id="metaTitle" placeholder="Enter SEO title" />
                  </div>
                  <div className="mb-3">
                    <FormLabel htmlFor="metaDescription">Meta Description</FormLabel>
                    <textarea className="form-control" id="metaDescription" rows={2} placeholder="Short description for search engines"></textarea>
                  </div>
                  <div className="mb-3">
                    <FormLabel htmlFor="metaKeywords">Meta Keywords</FormLabel>
                    <FormControl type="text" id="metaKeywords" placeholder="e.g. blog, bootstrap, tutorial" />
                  </div>
                </div>

                <div className="border-top pt-3 mt-4">
                  <h5 className="fw-bold text-uppercase mb-3 text-muted fs-sm">Visibility</h5>
                  <FormCheck className="form-switch mb-2">
                    <FormCheckInput className="form-check-input" type="checkbox" id="featured" />
                    <FormCheckLabel className="form-check-label" htmlFor="featured">
                      Mark as Featured Post
                    </FormCheckLabel>
                  </FormCheck>
                  <FormCheck className="form-switch">
                    <FormCheckInput className="form-check-input" type="checkbox" id="commentsEnabled" defaultChecked />
                    <FormCheckLabel className="form-check-label" htmlFor="commentsEnabled">
                      Allow Comments
                    </FormCheckLabel>
                  </FormCheck>
                </div>

                <div className="mt-4 mb-3">
                  <FormLabel className="fw-semibold">Status</FormLabel>
                  <div>
                    <FormCheck className="form-check-inline">
                      <FormCheckInput className="form-check-input" type="radio" name="status" id="draft" value="draft" defaultChecked />
                      <FormCheckLabel className="form-check-label" htmlFor="draft">
                        Draft
                      </FormCheckLabel>
                    </FormCheck>
                    <FormCheck className="form-check-inline">
                      <FormCheckInput className="form-check-input" type="radio" name="status" id="published" value="published" />
                      <FormCheckLabel className="form-check-label" htmlFor="published">
                        Published
                      </FormCheckLabel>
                    </FormCheck>
                  </div>
                </div>

                <div className="d-flex justify-content-center gap-2 mt-3">
                  <Button type="reset" className="btn btn-outline-secondary">
                    Reset
                  </Button>
                  <Button type="submit" className="btn btn-success">
                    Save as Draft
                  </Button>
                  <Button type="submit" className="btn btn-primary">
                    Publish Post
                  </Button>
                </div>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default CreateArticle
