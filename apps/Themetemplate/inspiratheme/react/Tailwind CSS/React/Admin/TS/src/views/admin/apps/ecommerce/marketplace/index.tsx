import PageBreadcrumb from '@/components/PageBreadcrumb'
import Icon from '@/components/wrappers/Icon'
import { Link } from 'react-router'
import CategoryCard from './components/CategoryCard'
import { categoryData, productData } from './components/data'
import ProductCard from './components/ProductCard'

import client1 from '@/assets/images/clients/01.svg'
import client2 from '@/assets/images/clients/02.svg'
import client3 from '@/assets/images/clients/03.svg'
import client4 from '@/assets/images/clients/04.svg'
import client5 from '@/assets/images/clients/05.svg'
import client6 from '@/assets/images/clients/06.svg'
import client7 from '@/assets/images/clients/07.svg'


const clients = [client1, client2, client3, client4, client5, client6, client7]

const Page = () => {
  return (
    <>
      <PageBreadcrumb title="Marketplace" subtitle="Ecommerce" />
      <div className="container">
        <div className="grid grid-cols-1 pt-6 md:grid-cols-2 lg:grid-cols-3 gap-base mb-base">
          {categoryData.map((category, idx) => (
            <CategoryCard key={idx} category={category} />
          ))}
        </div>
        <div className="pt-7.5">
          <span className="text-default-400 block text-center">👕 Discover styles tailored for everyone</span>
          <h3 className="mt-3 mb-7.5 text-center text-2xl font-bold">
            Find Your&nbsp;
            <mark className="bg-warning/15 text-default-800">Perfect Style</mark>
          </h3>
          <div className="flex justify-center gap-1.5 pt-1.5">
            <Link to="" className="badge rounded-full border border-dark/20 text-xs text-dark px-6 py-1 font-semibold">
              Best Sellers
            </Link>
            <Link to="" className="badge rounded-full border border-dark/20 text-xs text-default-400 px-6 py-1 font-semibold">
              New Arrived
            </Link>
            <Link to="" className="badge rounded-full border border-dark/20 text-xs text-default-400 px-6 py-1 font-semibold">
              Sale Items
            </Link>
            <Link to="" className="badge rounded-full border border-dark/20 text-xs text-default-400 px-6 py-1 font-semibold">
              Top Rated
            </Link>
          </div>
        </div>
        <div className="my-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-base">
          {productData.map((product, idx) => (
            <ProductCard key={idx} product={product} />
          ))}
        </div>
        <div className="text-end">
          <Link to="/apps/ecommerce/products-grid" className="btn bg-success mt-6 text-white hover:bg-success-hover">
            View More products
            <Icon icon="arrow-right" className="text-base" />
          </Link>
        </div>
        <div className="pt-7.5 text-center">
          <h3 className="mb-3 text-2xl font-bold">
            Shop by&nbsp;
            <mark className="bg-warning/15">Brand</mark>
          </h3>
          <span className="text-default-400 inline-block">🏷️ Discover trusted names loved by millions</span>
        </div>
        <div className="mx-auto mt-7.5 mb-15 lg:w-5xl">
          <div className="flex gap-base flex-wrap justify-center">
            {clients.map((client, idx) => (
              <div className="border-default-300 rounded border p-6" key={idx}>
                <Link to="" className="block">
                  <img src={client} alt="logo" className="block h-10.5" width={180} height={42} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default Page
