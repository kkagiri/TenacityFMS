import auFlag from '@/assets/images/flags/au.svg'
import brFlag from '@/assets/images/flags/br.svg'
import caFlag from '@/assets/images/flags/ca.svg'
import deFlag from '@/assets/images/flags/de.svg'
import frFlag from '@/assets/images/flags/fr.svg'
import gbFlag from '@/assets/images/flags/gb.svg'
import inFlag from '@/assets/images/flags/in.svg'
import itFlag from '@/assets/images/flags/it.svg'
import jpFlag from '@/assets/images/flags/jp.svg'
import usFlag from '@/assets/images/flags/us.svg'
import seller1 from '@/assets/images/sellers/1.png'
import seller10 from '@/assets/images/sellers/10.png'
import seller2 from '@/assets/images/sellers/2.png'
import seller3 from '@/assets/images/sellers/3.png'
import seller4 from '@/assets/images/sellers/4.png'
import seller5 from '@/assets/images/sellers/5.png'
import seller6 from '@/assets/images/sellers/6.png'
import seller7 from '@/assets/images/sellers/7.png'
import seller8 from '@/assets/images/sellers/8.png'
import seller9 from '@/assets/images/sellers/9.png'
function generateRandomData(count = 15, min = 5, max = 20) {
  return Array.from(
    {
      length: count,
    },
    () => Math.floor(Math.random() * (max - min + 1)) + min
  )
}
export const getSellerReportChartOptions = (type) => {
  return () => ({
    chart: {
      type: type,
      width: 100,
      height: 30,
      sparkline: {
        enabled: true,
      },
    },
    stroke: {
      width: type === 'line' ? 2 : 0,
      curve: type === 'line' ? 'smooth' : 'straight',
    },
    plotOptions: {
      bar: {
        columnWidth: '50%',
        borderRadius: 2,
      },
    },
    series: [
      {
        data: generateRandomData(),
      },
    ],
    colors: ['#3b82f6'],
    tooltip: {
      enabled: false,
    },
  })
}
export const sellerData = [
  {
    seller: {
      name: 'GreenTech Solutions',
      image: seller3,
      since: 2005,
    },
    products: 1456,
    orders: 18120,
    rating: 4.5,
    country: {
      code: 'CA',
      flag: caFlag,
    },
    balance: '$92.5k',
    rank: '1st',
    reportChartOptions: getSellerReportChartOptions('bar'),
  },
  {
    seller: {
      name: 'TechTonic Store',
      image: seller4,
      since: 2010,
    },
    products: 2378,
    orders: 25892,
    rating: 3,
    country: {
      code: 'UK',
      flag: gbFlag,
    },
    balance: '$145.7k',
    rank: '2nd',
    reportChartOptions: getSellerReportChartOptions('line'),
  },
  {
    seller: {
      name: 'UrbanTech Gadgets',
      image: seller5,
      since: 2012,
    },
    products: 3120,
    orders: 35210,
    rating: 3.5,
    country: {
      code: 'IN',
      flag: inFlag,
    },
    balance: '$300.4k',
    rank: '3rd',
    reportChartOptions: getSellerReportChartOptions('line'),
  },
  {
    seller: {
      name: 'NextGen Electronics',
      image: seller6,
      since: 2018,
    },
    products: 1748,
    orders: 12563,
    rating: 2,
    country: {
      code: 'FR',
      flag: frFlag,
    },
    balance: '$78.9k',
    rank: '4th',
    reportChartOptions: getSellerReportChartOptions('bar'),
  },
  {
    seller: {
      name: 'SmartHome Goods',
      image: seller7,
      since: 2015,
    },
    products: 520,
    orders: 3321,
    rating: 2,
    country: {
      code: 'DE',
      flag: deFlag,
    },
    balance: '$56.2k',
    rank: '5th',
    reportChartOptions: getSellerReportChartOptions('line'),
  },
  {
    seller: {
      name: 'TechMasters',
      image: seller8,
      since: 2013,
    },
    products: 2160,
    orders: 40500,
    rating: 5,
    country: {
      code: 'US',
      flag: usFlag,
    },
    balance: '$600k',
    rank: '6th',
    reportChartOptions: getSellerReportChartOptions('line'),
  },
  {
    seller: {
      name: 'FutureGizmos',
      image: seller9,
      since: 2020,
    },
    products: 1400,
    orders: 30000,
    rating: 2,
    country: {
      code: 'IT',
      flag: itFlag,
    },
    balance: '$170.2k',
    rank: '7th',
    reportChartOptions: getSellerReportChartOptions('line'),
  },
  {
    seller: {
      name: 'GizmoX',
      image: seller10,
      since: 2016,
    },
    products: 2100,
    orders: 28950,
    rating: 2,
    country: {
      code: 'AU',
      flag: auFlag,
    },
    balance: '$210.3k',
    rank: '8th',
    reportChartOptions: getSellerReportChartOptions('bar'),
  },
  {
    seller: {
      name: 'NextWave Electronics',
      image: seller1,
      since: 2017,
    },
    products: 1900,
    orders: 22510,
    rating: 3.5,
    country: {
      code: 'BR',
      flag: brFlag,
    },
    balance: '$125.4k',
    rank: '9th',
    reportChartOptions: getSellerReportChartOptions('bar'),
  },
  {
    seller: {
      name: 'FutureTech Innovations',
      image: seller2,
      since: 2019,
    },
    products: 3250,
    orders: 40300,
    rating: 4,
    country: {
      code: 'JP',
      flag: jpFlag,
    },
    balance: '$340.7k',
    rank: '10th',
    reportChartOptions: getSellerReportChartOptions('line'),
  },
]
