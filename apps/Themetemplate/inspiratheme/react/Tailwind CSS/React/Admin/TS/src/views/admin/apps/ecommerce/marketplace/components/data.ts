import client1 from '@/assets/images/clients/01.svg'
import client2 from '@/assets/images/clients/02.svg'
import client3 from '@/assets/images/clients/03.svg'
import client4 from '@/assets/images/clients/04.svg'
import client5 from '@/assets/images/clients/05.svg'
import client6 from '@/assets/images/clients/06.svg'
import client7 from '@/assets/images/clients/07.svg'
import product1 from '@/assets/images/products/1.png'
import product2 from '@/assets/images/products/2.png'
import product3 from '@/assets/images/products/3.png'
import product4 from '@/assets/images/products/4.png'
import product5 from '@/assets/images/products/5.png'
import product6 from '@/assets/images/products/6.png'
import product7 from '@/assets/images/products/7.png'
import product8 from '@/assets/images/products/8.png'
import handbagImg from '@/assets/images/products/hanbag.png'
import manImg from '@/assets/images/products/man.png'
import womenImg from '@/assets/images/products/women.png'

export type CategoryType = {
  title: string
  className: string
  links: { label: string; href: string }[]
  image: string
}

export const categoryData: CategoryType[] = [
  {
    title: 'For Men',
    className: 'bg-primary/10',
    links: [
      { label: 'Sports suits', href: '' },
      { label: 'Trousers', href: '' },
      { label: 'Jackets and coats', href: '' },
      { label: 'Shirts', href: '' },
    ],
    image: manImg,
  },
  {
    title: 'For Women',
    className: 'bg-warning/10',
    links: [
      { label: 'Dresses', href: '' },
      { label: 'Pants and jeans', href: '' },
      { label: 'Shirts and blouses', href: '' },
      { label: 'Sweatshirts', href: '' },
    ],
    image: womenImg,
  },
  {
    title: 'Accessories',
    className: 'bg-danger/10',
    links: [
      { label: 'Caps and hats', href: '' },
      { label: 'Sunglasses', href: '' },
      { label: 'Handbags', href: '' },
      { label: 'Jewelry', href: '' },
    ],
    image: handbagImg,
  },
]

export type ProductType = {
  name: string
  image: string
  reviews: number
  rating: number
  discount: number
  price: number
}

export const productData: ProductType[] = [
  {
    name: 'Modern Minimalist Fabric Sofa Single Seater',
    image: product1,
    reviews: 45,
    rating: 3,
    discount: 15,
    price: 899,
  },
  {
    name: 'Funky Streetwear Sneakers - Neon Splash',
    image: product2,
    reviews: 32,
    rating: 3,
    discount: 25,
    price: 59,
  },
  {
    name: 'Noise Canceling Wireless Earbuds - Black Edition',
    image: product3,
    reviews: 58,
    rating: 3,
    discount: 15,
    price: 49,
  },
  {
    name: 'Minimalist Solid Wood Dining Chair',
    image: product4,
    reviews: 46,
    rating: 3,
    discount: 20,
    price: 120,
  },
  {
    name: 'Modern Black Minimalist Wall Clock',
    image: product5,
    reviews: 62,
    rating: 4,
    discount: 20,
    price: 49,
  },
  {
    name: 'Elegant Brown Wooden Chair',
    image: product6,
    reviews: 48,
    rating: 4,
    discount: 20,
    price: 120,
  },
  {
    name: 'Apple iMac 24" Retina 4.5K Display',
    image: product7,
    reviews: 65,
    rating: 4,
    discount: 20,
    price: 1299,
  },
  {
    name: 'Coolest Ergonomic Lounge Chair',
    image: product8,
    reviews: 52,
    rating: 4,
    discount: 20,
    price: 320,
  },
]

export const brands = [{ image: client1 }, { image: client2 }, { image: client3 }, { image: client4 }, { image: client5 }, { image: client6 }, { image: client7 }]
