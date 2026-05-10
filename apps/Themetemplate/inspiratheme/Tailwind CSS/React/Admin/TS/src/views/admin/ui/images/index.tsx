import small1 from '@/assets/images/stock/small-1.jpg'
import small2 from '@/assets/images/stock/small-2.jpg'
import small5 from '@/assets/images/stock/small-5.jpg'
import user1 from '@/assets/images/users/user-1.jpg'
import user10 from '@/assets/images/users/user-10.jpg'
import user2 from '@/assets/images/users/user-2.jpg'
import user3 from '@/assets/images/users/user-3.jpg'
import user4 from '@/assets/images/users/user-4.jpg'
import user5 from '@/assets/images/users/user-5.jpg'
import user6 from '@/assets/images/users/user-6.jpg'
import user7 from '@/assets/images/users/user-7.jpg'
import user8 from '@/assets/images/users/user-8.jpg'
import user9 from '@/assets/images/users/user-9.jpg'
import ComponentCard from '@/components/cards/ComponentCard'
import PageBreadcrumb from '@/components/PageBreadcrumb'


const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Images" subtitle="Base UI" />

      <div className="container">
        <div className="grid grid-cols-1 gap-base mb-base">
          <ImagesShapes />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-base mb-base">
          <AvatarSizes />

          <AvatarSizesWithRounded />
        </div>
        <div className="grid grid-cols-1">
          <AvatarGroups />
        </div>
      </div>
    </>
  )
}

export default Page

const ImagesShapes = () => {
  return (
    <ComponentCard title="Shapes" isCollapsible>
      <p className="text-default-400 mb-4">Avatars with different sizes and shapes.</p>
      <div className="grid grid-cols-1 md:grid-cols-6 gap-base">
        <div>
          <img src={small1} alt="image" />
        </div>
        <div>
          <img src={small2} alt="image" className="rounded" />
        </div>
        <div>
          <img src={user2} alt="image" className="mx-auto rounded" />
        </div>
        <div>
          <img src={user5} alt="image" className="mx-auto rounded-full" />
        </div>
        <div>
          <img src={small5} alt="image" className="bg-default-100 border-default-300 rounded border p-1" />
        </div>
        <div>
          <img src={user8} alt="image" className="bg-default-100 border-default-300 mx-auto rounded-full border p-1" width={160} />
        </div>
      </div>
    </ComponentCard>
  )
}

const AvatarSizes = () => {
  return (
    <ComponentCard title="Avatar Sizes" isCollapsible>
      <div className="grid grid-cols-3 gap-base">
        <div>
          <img src={user2} alt="image" className="mx-auto size-6 rounded" />
          <p className="mt-2 mb-4 text-center">
            <code>.size-6</code>
          </p>
        </div>
        <div>
          <div className="bg-primary mx-auto flex size-6 items-center justify-center rounded font-medium text-white">xs</div>
          <p className="mt-2 mb-4 text-center">
            <code>.size-6</code>
          </p>
        </div>
        <div>
          <div className="bg-primary/15 text-primary mx-auto flex size-6 items-center justify-center rounded font-medium">xs</div>
          <p className="mt-2 mb-4 text-center">
            <code>.size-6</code>
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-base">
        <div>
          <img src={user3} alt="image" className="mx-auto size-8 rounded" />
          <p className="mt-2 mb-4 text-center">
            <code>.size-8</code>
          </p>
        </div>
        <div>
          <div className="bg-primary mx-auto flex size-8 items-center justify-center rounded font-medium text-white">sm</div>
          <p className="mt-2 mb-4 text-center">
            <code>.size-8</code>
          </p>
        </div>
        <div>
          <div className="bg-primary/15 text-primary mx-auto flex size-8 items-center justify-center rounded font-medium">sm</div>
          <p className="mt-2 mb-4 text-center">
            <code>.size-8</code>
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-base">
        <div>
          <img src={user4} alt="image" className="mx-auto size-9 rounded" />
          <p className="mt-2 mb-4 text-center">
            <code>.size-9</code>
          </p>
        </div>
        <div>
          <div className="bg-primary mx-auto flex size-9 items-center justify-center rounded font-medium text-white">md</div>
          <p className="mt-2 mb-4 text-center">
            <code>.size-9</code>
          </p>
        </div>
        <div>
          <div className="bg-primary/15 text-primary mx-auto flex size-9 items-center justify-center rounded font-medium">md</div>
          <p className="mt-2 mb-4 text-center">
            <code>.size-9</code>
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-base">
        <div>
          <img src={user5} alt="image" className="mx-auto size-11 rounded" />
          <p className="mt-2 mb-4 text-center">
            <code>.size-11</code>
          </p>
        </div>
        <div>
          <div className="bg-primary mx-auto flex size-11 items-center justify-center rounded font-medium text-white">LG</div>
          <p className="mt-2 mb-4 text-center">
            <code>.size-11</code>
          </p>
        </div>
        <div>
          <div className="bg-primary/15 text-primary mx-auto flex size-11 items-center justify-center rounded font-medium">LG</div>
          <p className="mt-2 mb-4 text-center">
            <code>.size-11</code>
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-base">
        <div>
          <img src={user6} alt="image" className="mx-auto size-12 rounded" />
          <p className="mt-2 mb-4 text-center">
            <code>.size-12</code>
          </p>
        </div>
        <div>
          <div className="bg-primary mx-auto flex size-12 items-center justify-center rounded font-medium text-white">XL</div>
          <p className="mt-2 mb-4 text-center">
            <code>.size-12</code>
          </p>
        </div>
        <div>
          <div className="bg-primary/15 text-primary mx-auto flex size-12 items-center justify-center rounded font-medium">XL</div>
          <p className="mt-2 mb-4 text-center">
            <code>.size-12</code>
          </p>
        </div>
      </div>
    </ComponentCard>
  )
}

const AvatarSizesWithRounded = () => {
  return (
    <ComponentCard title="Avatar Sizes with Rounded" isCollapsible>
      <div className="grid grid-cols-3 gap-base">
        <div>
          <img src={user7} alt="image" className="mx-auto size-6 rounded-full" />
          <p className="mt-2 mb-4 text-center">
            <code>.size-6</code>
          </p>
        </div>
        <div>
          <div className="bg-primary mx-auto flex size-6 items-center justify-center rounded-full font-medium text-white">xs</div>
          <p className="mt-2 mb-4 text-center">
            <code>.size-6</code>
          </p>
        </div>
        <div>
          <div className="bg-primary/15 text-primary mx-auto flex size-6 items-center justify-center rounded-full font-medium">xs</div>
          <p className="mt-2 mb-4 text-center">
            <code>.size-6</code>
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-base">
        <div>
          <img src={user8} alt="image" className="mx-auto size-8 rounded-full" />
          <p className="mt-2 mb-4 text-center">
            <code>.size-8</code>
          </p>
        </div>
        <div>
          <div className="bg-primary mx-auto flex size-8 items-center justify-center rounded-full font-medium text-white">sm</div>
          <p className="mt-2 mb-4 text-center">
            <code>.size-8</code>
          </p>
        </div>
        <div>
          <div className="bg-primary/15 text-primary mx-auto flex size-8 items-center justify-center rounded-full font-medium">sm</div>
          <p className="mt-2 mb-4 text-center">
            <code>.size-8</code>
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-base">
        <div>
          <img src={user9} alt="image" className="mx-auto size-9 rounded-full" />
          <p className="mt-2 mb-4 text-center">
            <code>.size-9</code>
          </p>
        </div>
        <div>
          <div className="bg-primary mx-auto flex size-9 items-center justify-center rounded-full font-medium text-white">md</div>
          <p className="mt-2 mb-4 text-center">
            <code>.size-9</code>
          </p>
        </div>
        <div>
          <div className="bg-primary/15 text-primary mx-auto flex size-9 items-center justify-center rounded-full font-medium">md</div>
          <p className="mt-2 mb-4 text-center">
            <code>.size-9</code>
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-base">
        <div>
          <img src={user10} alt="image" className="mx-auto size-11 rounded-full" />
          <p className="mt-2 mb-4 text-center">
            <code>.size-11</code>
          </p>
        </div>
        <div>
          <div className="bg-primary mx-auto flex size-11 items-center justify-center rounded-full font-medium text-white">LG</div>
          <p className="mt-2 mb-4 text-center">
            <code>.size-11</code>
          </p>
        </div>
        <div>
          <div className="bg-primary/15 text-primary mx-auto flex size-11 items-center justify-center rounded-full font-medium">LG</div>
          <p className="mt-2 mb-4 text-center">
            <code>.size-11</code>
          </p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-base">
        <div>
          <img src={user1} alt="image" className="mx-auto size-12 rounded-full" />
          <p className="mt-2 mb-4 text-center">
            <code>.size-12</code>
          </p>
        </div>
        <div>
          <div className="bg-primary mx-auto flex size-12 items-center justify-center rounded-full font-medium text-white">XL</div>
          <p className="mt-2 mb-4 text-center">
            <code>.size-12</code>
          </p>
        </div>
        <div>
          <div className="bg-primary/15 text-primary mx-auto flex size-12 items-center justify-center rounded-full font-medium">XL</div>
          <p className="mt-2 mb-4 text-center">
            <code>.size-12</code>
          </p>
        </div>
      </div>
    </ComponentCard>
  )
}

const AvatarGroups = () => {
  return (
    <ComponentCard title="Avatar Groups" isCollapsible>
      <div className="grid grid-cols-1 xl:grid-cols-4 lg:gap-base">
        <div className="flex -space-x-3">
          <img src={user4} alt="" className="size-8 transform rounded-full duration-300 hover:-translate-y-0.5" />
          <img src={user5} alt="" className="size-8 transform rounded-full duration-300 hover:-translate-y-0.5" />
          <img src={user3} alt="" className="size-8 transform rounded-full duration-300 hover:-translate-y-0.5" />
          <img src={user8} alt="" className="size-8 transform rounded-full duration-300 hover:-translate-y-0.5" />
          <img src={user2} alt="" className="size-8 transform rounded-full duration-300 hover:-translate-y-0.5" />
        </div>
        <div className="flex -space-x-3">
          <div className="bg-danger flex size-9 transform items-center justify-center rounded-full font-medium text-white duration-300 hover:-translate-y-0.5">D</div>
          <div className="bg-primary flex size-9 transform items-center justify-center rounded-full font-medium text-white duration-300 hover:-translate-y-0.5">K</div>
          <div className="bg-secondary flex size-9 transform items-center justify-center rounded-full font-medium text-white duration-300 hover:-translate-y-0.5">H</div>
          <div className="bg-warning flex size-9 transform items-center justify-center rounded-full font-medium text-white duration-300 hover:-translate-y-0.5">L</div>
          <div className="bg-info flex size-9 transform items-center justify-center rounded-full font-medium text-white duration-300 hover:-translate-y-0.5">G</div>
        </div>
        <div className="flex -space-x-3">
          <div className="bg-danger/15 text-danger relative flex size-11 transform items-center justify-center rounded-full font-semibold backdrop-blur-sm duration-300 hover:z-10 hover:-translate-y-0.5">D</div>
          <div className="bg-primary/15 text-primary relative flex size-11 transform items-center justify-center rounded-full font-semibold backdrop-blur-sm duration-300 hover:z-10 hover:-translate-y-0.5">K</div>
          <div className="bg-secondary/15 text-secondary relative flex size-11 transform items-center justify-center rounded-full font-semibold backdrop-blur-sm duration-300 hover:z-10 hover:-translate-y-0.5">H</div>
          <div className="bg-warning/15 text-warning relative flex size-11 transform items-center justify-center rounded-full font-semibold backdrop-blur-sm duration-300 hover:z-10 hover:-translate-y-0.5">L</div>
          <div className="bg-info/15 text-info relative flex size-11 transform items-center justify-center rounded-full font-semibold backdrop-blur-sm duration-300 hover:z-10 hover:-translate-y-0.5">G</div>
        </div>
        <div className="flex -space-x-3">
          <img src={user10} alt="" className="size-12 transform rounded-full duration-300 hover:-translate-y-0.5" />
          <div className="bg-info flex size-12 transform items-center justify-center rounded-full font-medium text-white duration-300 hover:-translate-y-0.5">D</div>
          <img src={user7} alt="" className="size-12 transform rounded-full duration-300 hover:-translate-y-0.5" />
          <img src={user1} alt="" className="size-12 transform rounded-full duration-300 hover:-translate-y-0.5" />
          <div className="bg-danger flex size-12 transform items-center justify-center rounded-full text-lg font-medium text-white duration-300 hover:-translate-y-0.5">9+</div>
        </div>
      </div>
    </ComponentCard>
  )
}
