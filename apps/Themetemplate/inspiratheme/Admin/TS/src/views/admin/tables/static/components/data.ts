type Product = {
  name: string
  category: string
  price: number
  stock: number
  rating: number
  status: 'active' | 'out-of-stock'
}

type TableType<T> = {
  header: string[]
  data: T[]
}

export const productsTable: TableType<Product> = {
  header: ['Product Name', 'Category', 'Price', 'Stock', 'Rating', 'Status', 'Actions'],
  data: [
    {
      name: 'Wireless Headphones',
      category: 'Electronics',
      price: 99.0,
      stock: 120,
      rating: 4.6,
      status: 'active',
    },
    {
      name: 'Running Shoes',
      category: 'Footwear',
      price: 59.99,
      stock: 80,
      rating: 4.2,
      status: 'active',
    },
    {
      name: 'Smartwatch',
      category: 'Wearables',
      price: 129.0,
      stock: 0,
      rating: 4.1,
      status: 'out-of-stock',
    },
    {
      name: 'Gaming Mouse	',
      category: 'Accessories',
      price: 39.0,
      stock: 250,
      rating: 4.7,
      status: 'active',
    },
    {
      name: 'Office Chair',
      category: 'Furniture',
      price: 149.0,
      stock: 35,
      rating: 4.3,
      status: 'active',
    },
  ],
}
