import product1 from '@/assets/images/products/1.png'
import product10 from '@/assets/images/products/10.png'
import product2 from '@/assets/images/products/2.png'
import product3 from '@/assets/images/products/3.png'
import product4 from '@/assets/images/products/4.png'
import product5 from '@/assets/images/products/5.png'
import product6 from '@/assets/images/products/6.png'
import product7 from '@/assets/images/products/7.png'
import product8 from '@/assets/images/products/8.png'
import product9 from '@/assets/images/products/9.png'

export type ProductType = {
  name: string
  image: string
  price: number
  discount?: number
  rating: number
  reviews: number
}

export const productData: ProductType[] = [
  {
    name: 'Modern Minimalist Fabric Sofa Single Seater',
    image: product1,
    price: 899.0,
    discount: 15,
    rating: 3,
    reviews: 45,
  },
  {
    name: 'Funky Streetwear Sneakers - Neon Splash',
    image: product2,
    price: 59.99,
    discount: 25,
    rating: 3,
    reviews: 32,
  },
  {
    name: 'Noise Canceling Wireless Earbuds - Black Edition',
    image: product3,
    price: 49.99,
    discount: 15,
    rating: 3,
    reviews: 58,
  },
  {
    name: 'Minimalist Solid Wood Dining Chair',
    image: product4,
    price: 120.0,
    rating: 3,
    discount: 15,
    reviews: 46,
  },
  {
    name: 'Modern Black Minimalist Wall Clock',
    image: product5,
    price: 49.99,
    rating: 4,
    discount: 15,
    reviews: 62,
  },
  {
    name: 'Elegant Brown Wooden Chair',
    image: product6,
    price: 120.0,
    discount: 20,
    rating: 4,
    reviews: 48,
  },
  {
    name: 'Apple iMac 24" Retina 4.5K Display',
    image: product7,
    price: 1299.0,
    rating: 4,
    discount: 15,
    reviews: 65,
  },
  {
    name: 'Coolest Ergonomic Lounge Chair',
    image: product8,
    price: 320.0,
    discount: 20,
    rating: 4,
    reviews: 52,
  },
  {
    name: 'Apple iPad 10.9" Wi-Fi 64GB - Silver',
    image: product9,
    price: 449.0,
    rating: 4,
    reviews: 142,
  },
  {
    name: 'Minimalist Denim Jacket – Indigo Blue',
    image: product10,
    price: 89.0,
    rating: 4,
    reviews: 54,
  },
  {
    name: 'Next-Gen Smartwatch S9 – Graphite Black',
    image: product1,
    price: 249.0,
    rating: 4,
    reviews: 128,
  },
  {
    name: 'Noise-Cancel Pro Headphones – Arctic White',
    image: product2,
    price: 199.99,
    rating: 4,
    reviews: 87,
  },
]

type FilterType = {
  id: string
  name: string
  value?: number
}

export const categoryData: FilterType[] = [
  { id: 'electronics', name: 'Electronics', value: 8 },
  { id: 'computers', name: 'Computers', value: 5 },
  { id: 'home-office', name: 'Home & Office', value: 6 },
  { id: 'accessories', name: 'Accessories' },
  { id: 'gaming', name: 'Gaming', value: 9 },
  { id: 'mobile-phones', name: 'Mobile Phones', value: 12 },
  { id: 'appliances', name: 'Appliances' },
]

export const brandData: FilterType[] = [
  { id: 'apple', name: 'Apple', value: 14 },
  { id: 'samsung', name: 'Samsung', value: 20 },
  { id: 'sony', name: 'Sony' },
  { id: 'dell', name: 'Dell', value: 7 },
  { id: 'hp', name: 'HP' },
]

export const ratingData: FilterType[] = [
  { id: '5', name: '5', value: 120 },
  { id: '4', name: '4', value: 210 },
  { id: '3', name: '3', value: 325 },
  { id: '2', name: '2', value: 145 },
  { id: '1', name: '1', value: 58 },
]
