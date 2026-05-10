import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Videos" subtitle="UI" />
      <div className="container">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base">
          <div className="flex flex-col gap-base">
            <ResponsiveEmbedVideo219 />

            <ResponsiveEmbedVideo11 />
          </div>
          <div className="flex flex-col gap-base">
            <ResponsiveEmbedVideo169 />

            <ResponsiveEmbedVideo43 />
          </div>
        </div>
      </div>
    </>
  )
}

export default Page

const ResponsiveEmbedVideo219 = () => {
  return (
    <ComponentCard title="Responsive embed video 21:9" isCollapsible>
      <div className="relative aspect-21/9 w-full">
        <iframe src="https://www.youtube.com/embed/zpOULjyy-n8?rel=0" className="h-full w-full" />
      </div>
    </ComponentCard>
  )
}

const ResponsiveEmbedVideo11 = () => {
  return (
    <ComponentCard title="Responsive embed video 1:1" isCollapsible>
      <div className="relative aspect-square w-full">
        <iframe src="https://www.youtube.com/embed/zpOULjyy-n8?rel=0" className="h-full w-full" />
      </div>
    </ComponentCard>
  )
}

const ResponsiveEmbedVideo169 = () => {
  return (
    <ComponentCard title="Responsive embed video 16:9" isCollapsible>
      <div className="relative aspect-video w-full">
        <iframe src="https://www.youtube.com/embed/zpOULjyy-n8?rel=0" className="h-full w-full" />
      </div>
    </ComponentCard>
  )
}

const ResponsiveEmbedVideo43 = () => {
  return (
    <ComponentCard title="Responsive embed video 4:3" isCollapsible>
      <div className="relative aspect-4/3 w-full">
        <iframe src="https://www.youtube.com/embed/zpOULjyy-n8?rel=0" className="h-full w-full" />
      </div>
    </ComponentCard>
  )
}
