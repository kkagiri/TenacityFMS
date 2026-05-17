import small1 from '@/assets/images/stock/small-1.jpg'
import small10 from '@/assets/images/stock/small-10.jpg'
import small2 from '@/assets/images/stock/small-2.jpg'
import small3 from '@/assets/images/stock/small-3.jpg'
import small4 from '@/assets/images/stock/small-4.jpg'
import small5 from '@/assets/images/stock/small-5.jpg'
import small6 from '@/assets/images/stock/small-6.jpg'
import small8 from '@/assets/images/stock/small-8.jpg'
import small9 from '@/assets/images/stock/small-9.jpg'
import PageBreadcrumb from '@/components/PageBreadcrumb'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Cards" subtitle="Base UI" />

      <div className="container-fluid">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-base mb-base">
          <div className="card">
            <Basic />
          </div>
          <div className="card">
            <BasicCardWithTitle />
          </div>
          <div className="card bg-primary">
            <CardWithBackgroundColor />
          </div>
          <div className="card bg-success">
            <CardWithBackgroundGradient />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-base mb-base">
          <div className="card">
            <CardWithHeader />
          </div>
          <div className="card">
            <CardWithSubHeader />
          </div>
          <div className="card">
            <FeaturedCardTitle />
          </div>
        </div>
        <h4 className="mb-6 mt-4 text-base">Advanced Card</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-base mb-base">
          <div className="card">
            <CardWithActionTools />
          </div>
          <div className="card bg-info!">
            <CardWithActionToolsBgColor />
          </div>
          <div className="card">
            <CardWithActionTools />
          </div>
        </div>
        <h4 className="mb-6 mt-4 text-base">Bordered Card</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-base mb-base">
          <div className="card border-primary border">
            <CardWithColoredBorder />
          </div>
          <div className="card border-primary border border-dashed">
            <CardWithSimpleBorder />
          </div>
          <div className="card border-primary border-2">
            <CardWithDoubleBorder />
          </div>
          <div className="card border-dark border-s-3">
            <CardWithStartBorder />
          </div>
          <div className="card border-primary border-s-3">
            <CardWithColored />
          </div>
          <div className="card border-info border-s-3">
            <CardColoredBorder />
          </div>
        </div>
        <h4 className="mb-6 mt-4 text-base">Horizontal Card</h4>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base mb-base">
          <div className="card">
            <CardWithHorizontalMode />
          </div>
          <div className="card">
            <CardWithHorizontalMode2 />
          </div>
        </div>
        <h4 className="mb-6 mt-4 text-base">Stretched Link</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-base mb-base">
          <div className="card group">
            <CardWithStretchedLink />
          </div>
          <div className="card">
            <CardWithStretchedLink2 />
          </div>
          <div className="card group">
            <CardWithStretchedLink3 />
          </div>
          <div className="card">
            <CardWithStretchedLink4 />
          </div>
        </div>
        <h4 className="mb-6 mt-4 text-base">Card Group</h4>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-0 mb-base">
          <CardWithGroup />
        </div>
        <div className="grid gap-3 rounded md:grid-cols-3 md:gap-0 mb-base">
          <CardWithGroup2 />
        </div>
        <h4 className="mb-6 mt-4 text-base">Navigation with Card</h4>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="card">
            <NavigationWithCard />
          </div>
          <div className="card">
            <NavigationWithCard2 />
          </div>
        </div>
      </div>
    </>
  )
}

export default Page

const Basic = () => {
  return (
    <>
      <div className="card-body">
        <p className="mb-4">Some quick example text to build on the card title and make up the bulk of the card&apos;s content. Some quick example text to build on the card title and make up.</p>
        <a href="" className="btn btn-sm bg-primary hover:bg-primary-hover text-white">
          Button
        </a>
      </div>
    </>
  )
}

const BasicCardWithTitle = () => {
  return (
    <>
      <div className="card-body">
        <h5 className="card-title mb-2">Basic Card with Title</h5>
        <p className="mb-4">Some quick example text to build on the card title and make up the bulk of the card&apos;s content. Some quick example text to build on the card title and make up.</p>
        <a href="" className="btn btn-sm bg-primary hover:bg-primary-hover text-white">
          Button
        </a>
      </div>
    </>
  )
}

const CardWithBackgroundColor = () => {
  return (
    <>
      <div className="card-body">
        <h5 className="card-title mb-2 text-white">Card with Background Color</h5>
        <p className="mb-4 text-white">Some quick example text to build on the card title and make up the bulk of the card&apos;s content. Some quick example text to build on the card title and make up.</p>
        <a href="" className="btn btn-sm bg-default-50 hover:text-primary">
          Button
        </a>
      </div>
    </>
  )
}

const CardWithBackgroundGradient = () => {
  return (
    <>
      <div className="card-body">
        <h5 className="card-title mb-2 text-white">Card with Background Gradient</h5>
        <p className="mb-4 text-white">Some quick example text to build on the card title and make up the bulk of the card&apos;s content. Some quick example text to build on the card title and make up.</p>
        <a href="" className="btn btn-sm bg-default-50 hover:text-primary">
          Button
        </a>
      </div>
    </>
  )
}

const CardWithHeader = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Card with Header</h4>
      </div>
      <div className="card-body">
        <h5 className="card-title mb-2">Special title treatment</h5>
        <p className="mb-4">With supporting text below as a natural lead-in to additional content.</p>
        <a href="" className="btn btn-sm bg-primary hover:bg-primary-hover text-white">
          Go somewhere
        </a>
      </div>
    </>
  )
}

const CardWithSubHeader = () => {
  return (
    <>
      <div className="card-header block border-dashed">
        <h4 className="card-title mb-1.25">Card with Sub Header</h4>
        <h6 className="text-default-400 text-2xs">Card subtitle</h6>
      </div>
      <div className="card-body">
        <p className="mb-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante.</p>
        <p>Someone famous in Source Title</p>
      </div>
    </>
  )
}

const FeaturedCardTitle = () => {
  return (
    <>
      <div className="card-header">Featured Card Title</div>
      <div className="card-body">
        <a href="" className="btn btn-sm bg-primary hover:bg-primary-hover text-white">
          Go somewhere
        </a>
      </div>
      <div className="card-footer text-default-400">2 days ago</div>
    </>
  )
}

const CardWithActionTools = () => {
  return (
    <>
      <div className="card-header">
        <h4 className="card-title">Card with Action Tools</h4>
      </div>
      <div className="card-body">
        <p className="mb-4">With supporting text below as a natural lead-in to additional content.</p>
        <a href="" className="btn btn-sm bg-primary hover:bg-primary-hover text-white">
          Go somewhere
        </a>
      </div>
    </>
  )
}

const CardWithActionToolsBgColor = () => {
  return (
    <>
      <div className="card-header border-dashed border-white">
        <h4 className="card-title text-white">Card with Action Tools &amp; Background Colors</h4>
      </div>
      <div className="card-body">
        <p className="mb-4 text-white">With supporting text below as a natural lead-in to additional content.</p>
        <a href="" className="btn btn-sm hover:text-primary bg-white">
          Go somewhere
        </a>
      </div>
    </>
  )
}

const CardWithColoredBorder = () => {
  return (
    <>
      <div className="card-body">
        <h4 className="card-title mb-3">Card with Colored Border</h4>
        <p className="mb-4">With supporting text below as a natural lead-in to additional content.</p>
        <a href="" className="btn btn-sm bg-primary hover:bg-primary-hover text-white">
          Button
        </a>
      </div>
    </>
  )
}

const CardWithSimpleBorder = () => {
  return (
    <>
      <div className="card-body">
        <h4 className="card-title text-primary mb-3">Card with Simple Border</h4>
        <p className="mb-4">With supporting text below as a natural lead-in to additional content.</p>
        <a href="" className="btn btn-sm bg-primary hover:bg-primary-hover text-white">
          Button
        </a>
      </div>
    </>
  )
}

const CardWithDoubleBorder = () => {
  return (
    <>
      <div className="card-body">
        <h4 className="card-title text-primary mb-3">Card with Double Border</h4>
        <p className="mb-4">With supporting text below as a natural lead-in to additional content.</p>
        <a href="" className="btn btn-sm bg-primary hover:bg-primary-hover text-white">
          Button
        </a>
      </div>
    </>
  )
}

const CardWithStartBorder = () => {
  return (
    <>
      <div className="card-body">
        <h4 className="card-title text-dark mb-3">Card with Double Border</h4>
        <p className="mb-4">With supporting text below as a natural lead-in to additional content.</p>
        <a href="" className="btn btn-sm bg-dark hover:bg-primary-hover text-white">
          Button
        </a>
      </div>
    </>
  )
}

const CardWithColored = () => {
  return (
    <>
      <div className="card-body">
        <h4 className="card-title text-primary mb-3">Card with Colored Border</h4>
        <p className="mb-4">With supporting text below as a natural lead-in to additional content.</p>
        <a href="" className="btn btn-sm bg-primary hover:bg-primary-hover text-white">
          Button
        </a>
      </div>
    </>
  )
}

const CardColoredBorder = () => {
  return (
    <>
      <div className="card-body">
        <h4 className="card-title mb-3">Card with Colored Border</h4>
        <p className="mb-4">With supporting text below as a natural lead-in to additional content.</p>
        <a href="" className="btn btn-sm bg-info hover:bg-primary-hover text-white">
          Button
        </a>
      </div>
    </>
  )
}

const CardWithHorizontalMode = () => {
  return (
    <>
      <div className="grid grid-cols-1 items-center md:grid-cols-12">
        <div className="col-span-4">
          <img src={small1} className="rounded-s" alt="..." />
        </div>
        <div className="col-span-8">
          <div className="card-body">
            <h5 className="card-title mb-5">Card with Horizontal Mode</h5>
            <p className="mb-4">This is a wider card with supporting text below as a natural lead-in to additional content. This content is a little bit longer.</p>
            <p>
              <small className="text-default-400 text-2xs">Last updated 3 mins ago</small>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

const CardWithHorizontalMode2 = () => {
  return (
    <>
      <div className="grid grid-cols-1 items-center md:grid-cols-12">
        <div className="col-span-8">
          <div className="card-body">
            <h5 className="card-title mb-5">Card with Horizontal Mode</h5>
            <p className="mb-4">This is a wider card with supporting text below as a natural lead-in to additional content. This content is a little bit longer.</p>
            <p>
              <small className="text-default-400 text-2xs">Last updated 3 mins ago</small>
            </p>
          </div>
        </div>
        <div className="col-span-4">
          <img src={small2} className="rounded-e" alt="..." />
        </div>
      </div>
    </>
  )
}

const CardWithStretchedLink = () => {
  return (
    <>
      <a href="">
        <img src={small3} className="rounded-t" alt="..." />
      </a>
      <div className="card-body">
        <a href="">
          <h5 className="card-title mb-3">Card with stretched link</h5>
        </a>
        <a href="" className="btn btn-sm bg-primary group-hover:bg-primary-hover mt-3 text-white">
          Button
        </a>
      </div>
    </>
  )
}

const CardWithStretchedLink2 = () => {
  return (
    <>
      <a href="">
        <img src={small4} className="rounded-t" alt="..." />
        <div className="card-body">
          <h5 className="card-title text-primary mb-3">Card with stretched link</h5>
          <p>Some quick example text to build on the card up the bulk of the card&apos;s content.</p>
        </div>
      </a>
    </>
  )
}

const CardWithStretchedLink3 = () => {
  return (
    <>
      <a href="">
        <img src={small5} className="rounded-t" alt="..." />
      </a>
      <div className="card-body">
        <a href="">
          <h5 className="card-title mb-3">Card with stretched link</h5>
        </a>
        <a href="" className="btn btn-sm bg-primary group-hover:bg-primary-hover mt-3 text-white">
          Button
        </a>
      </div>
    </>
  )
}

const CardWithStretchedLink4 = () => {
  return (
    <>
      <a href="">
        <img src={small6} className="rounded-t" alt="..." />
        <div className="card-body">
          <h5 className="card-title text-primary mb-3">Card with stretched link</h5>
          <p>Some quick example text to build on the card up the bulk of the card&apos;s content.</p>
        </div>
      </a>
    </>
  )
}

const CardWithGroup = () => {
  return (
    <>
      <div className="card h-full md:rounded-s md:rounded-e-none">
        <img className="card-img-top" src={small8} alt="Card image cap" />
        <div className="card-body">
          <h5 className="card-title mb-3">Card title</h5>
          <p className="mb-4">This is a wider card with supporting text below as a natural lead-in to additional content. This content is a little bit longer.</p>
          <p>
            <small className="text-default-400 text-2xs">Last updated 3 mins ago</small>
          </p>
        </div>
      </div>
      <div className="card h-full md:rounded-none">
        <img className="card-img-top" src={small9} alt="Card image cap" />
        <div className="card-body">
          <h5 className="card-title mb-3">Card title</h5>
          <p className="mb-4">This card has supporting text below as a natural lead-in to additional content.</p>
          <p>
            <small className="text-default-400 text-2xs">Last updated 3 mins ago</small>
          </p>
        </div>
      </div>
      <div className="card h-full md:rounded-s-none md:rounded-e">
        <img className="card-img-top" src={small10} alt="Card image cap" />
        <div className="card-body">
          <h5 className="card-title mb-3">Card title</h5>
          <p className="mb-4">This is a wider card with supporting text below as a natural lead-in to additional content. This card has even longer content than the first to show that equal height action.</p>
          <p>
            <small className="text-default-400 text-2xs">Last updated 3 mins ago</small>
          </p>
        </div>
      </div>
    </>
  )
}

const CardWithGroup2 = () => {
  return (
    <>
      <div className="card h-full md:rounded-s md:rounded-e-none">
        <div className="card-body flex-1">
          <h5 className="card-title mb-3">Card title</h5>
          <p>This is a wider card with supporting text below as a natural lead-in to additional content. This content is a little bit longer.</p>
        </div>
        <div className="card-footer">
          <p>
            <small className="text-default-400 text-2xs">Last updated 3 mins ago</small>
          </p>
        </div>
      </div>
      <div className="card h-full md:rounded-none">
        <div className="card-body flex-1">
          <h5 className="card-title mb-3">Card title</h5>
          <p>This card has supporting text below as a natural lead-in to additional content.</p>
        </div>
        <div className="card-footer">
          <p>
            <small className="text-default-400 text-2xs">Last updated 3 mins ago</small>
          </p>
        </div>
      </div>
      <div className="card h-full md:rounded-s-none md:rounded-e">
        <div className="card-body flex-1">
          <h5 className="card-title mb-3">Card title</h5>
          <p>This is a wider card with supporting text below as a natural lead-in to additional content. This card has even longer content than the first to show that equal height action.</p>
        </div>
        <div className="card-footer">
          <p>
            <small className="text-default-400 text-2xs">Last updated 3 mins ago</small>
          </p>
        </div>
      </div>
    </>
  )
}

const NavigationWithCard = () => {
  return (
    <>
      <div className="card-header border-dashed pb-0">
        <nav className="flex">
          <a href="" className="text-primary border-default-300 rounded-t-lg border border-b-0 px-4 py-2 text-center text-sm font-medium">
            Active
          </a>
          <a href="" className="text-default-600 px-4 py-2 font-medium">
            Link
          </a>
          <a href="" className="px-4 py-2 font-medium">
            Disabled
          </a>
        </nav>
      </div>
      <div className="card-body">
        <h5 className="text-md mb-2 text-center">Special title treatment</h5>
        <p className="mb-4 text-center">With supporting text below as a natural lead-in to additional content.</p>
        <div className="text-center">
          <a href="" className="btn btn-sm bg-primary hover:bg-primary-hover text-white">
            Go somewhere
          </a>
        </div>
      </div>
    </>
  )
}

const NavigationWithCard2 = () => {
  return (
    <>
      <div className="card-header">
        <nav className="flex">
          <a href="" className="btn btn-sm bg-primary hover:bg-primary-hover text-white">
            Active
          </a>
          <a href="" className="text-default-600 px-4 py-2 font-medium">
            Link
          </a>
          <a href="" className="px-4 py-2 font-medium">
            Disabled
          </a>
        </nav>
      </div>
      <div className="card-body">
        <h5 className="text-md mb-2 text-center">Special title treatment</h5>
        <p className="mb-4 text-center">With supporting text below as a natural lead-in to additional content.</p>
        <div className="text-center">
          <a href="" className="btn btn-sm bg-primary hover:bg-primary-hover text-white">
            Go somewhere
          </a>
        </div>
      </div>
    </>
  )
}
