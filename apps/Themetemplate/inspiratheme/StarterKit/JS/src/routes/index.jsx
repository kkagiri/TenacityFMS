import MainLayout from '@/layouts/MainLayout'
import { lazy } from 'react'
import { Navigate } from 'react-router'
export const routes = [
  {
    path: '',
    element: <Navigate to="/dashboard/projects" />,
  },
  {
    element: <MainLayout />,
    children: [
      {
        path: '/dashboard/projects',
        Component: lazy(() => import('@/views/admin/dashboard/projects')),
      },
      {
        path: '/icons/tabler',
        Component: lazy(() => import('@/views/admin/icons/tabler')),
      },
      {
        path: '/layouts/boxed',
        Component: lazy(() => import('@/views/admin/layouts/boxed')),
      },
      {
        path: '/layouts/compact',
        Component: lazy(() => import('@/views/admin/layouts/compact')),
      },
      {
        path: '/layouts/horizontal',
        Component: lazy(() => import('@/views/admin/layouts/horizontal')),
      },
      {
        path: '/layouts/preloader',
        Component: lazy(() => import('@/views/admin/layouts/preloader')),
      },
      {
        path: '/layouts/scrollable',
        Component: lazy(() => import('@/views/admin/layouts/scrollable')),
      },
      {
        path: '/layouts/sidebar-compact',
        Component: lazy(() => import('@/views/admin/layouts/sidebar-compact')),
      },
      {
        path: '/layouts/sidebar-gradient',
        Component: lazy(() => import('@/views/admin/layouts/sidebar-gradient')),
      },
      {
        path: '/layouts/sidebar-gray',
        Component: lazy(() => import('@/views/admin/layouts/sidebar-gray')),
      },
      {
        path: '/layouts/sidebar-image',
        Component: lazy(() => import('@/views/admin/layouts/sidebar-image')),
      },
      {
        path: '/layouts/sidebar-light',
        Component: lazy(() => import('@/views/admin/layouts/sidebar-light')),
      },
      {
        path: '/layouts/sidebar-no-icons',
        Component: lazy(() => import('@/views/admin/layouts/sidebar-no-icons')),
      },
      {
        path: '/layouts/sidebar-offcanvas',
        Component: lazy(() => import('@/views/admin/layouts/sidebar-offcanvas')),
      },
      {
        path: '/layouts/sidebar-on-hover',
        Component: lazy(() => import('@/views/admin/layouts/sidebar-on-hover')),
      },
      {
        path: '/layouts/sidebar-on-hover-active',
        Component: lazy(() => import('@/views/admin/layouts/sidebar-on-hover-active')),
      },
      {
        path: '/layouts/sidebar-with-lines',
        Component: lazy(() => import('@/views/admin/layouts/sidebar-with-lines')),
      },
      {
        path: '/layouts/topbar-dark',
        Component: lazy(() => import('@/views/admin/layouts/topbar-dark')),
      },
      {
        path: '/layouts/topbar-gradient',
        Component: lazy(() => import('@/views/admin/layouts/topbar-gradient')),
      },
      {
        path: '/layouts/topbar-gray',
        Component: lazy(() => import('@/views/admin/layouts/topbar-gray')),
      },
      {
        path: '/pages/empty',
        Component: lazy(() => import('@/views/admin/pages/empty')),
      },
    ],
  },
  {
    path: '/auth/card/delete-account',
    Component: lazy(() => import('@/views/auth/card/delete-account')),
  },
  {
    path: '/auth/card/lock-screen',
    Component: lazy(() => import('@/views/auth/card/lock-screen')),
  },
  {
    path: '/auth/card/login-pin',
    Component: lazy(() => import('@/views/auth/card/login-pin')),
  },
  {
    path: '/auth/card/new-pass',
    Component: lazy(() => import('@/views/auth/card/new-pass')),
  },
  {
    path: '/auth/card/reset-pass',
    Component: lazy(() => import('@/views/auth/card/reset-pass')),
  },
  {
    path: '/auth/card/sign-in',
    Component: lazy(() => import('@/views/auth/card/sign-in')),
  },
  {
    path: '/auth/card/sign-up',
    Component: lazy(() => import('@/views/auth/card/sign-up')),
  },
  {
    path: '/auth/card/success-mail',
    Component: lazy(() => import('@/views/auth/card/success-mail')),
  },
  {
    path: '/auth/card/two-factor',
    Component: lazy(() => import('@/views/auth/card/two-factor')),
  },
  {
    path: '/auth/delete-account',
    Component: lazy(() => import('@/views/auth/basic/delete-account')),
  },
  {
    path: '/auth/lock-screen',
    Component: lazy(() => import('@/views/auth/basic/lock-screen')),
  },
  {
    path: '/auth/login-pin',
    Component: lazy(() => import('@/views/auth/basic/login-pin')),
  },
  {
    path: '/auth/new-pass',
    Component: lazy(() => import('@/views/auth/basic/new-pass')),
  },
  {
    path: '/auth/reset-pass',
    Component: lazy(() => import('@/views/auth/basic/reset-pass')),
  },
  {
    path: '/auth/sign-in',
    Component: lazy(() => import('@/views/auth/basic/sign-in')),
  },
  {
    path: '/auth/sign-up',
    Component: lazy(() => import('@/views/auth/basic/sign-up')),
  },
  {
    path: '/auth/split/delete-account',
    Component: lazy(() => import('@/views/auth/split/delete-account')),
  },
  {
    path: '/auth/split/lock-screen',
    Component: lazy(() => import('@/views/auth/split/lock-screen')),
  },
  {
    path: '/auth/split/login-pin',
    Component: lazy(() => import('@/views/auth/split/login-pin')),
  },
  {
    path: '/auth/split/new-pass',
    Component: lazy(() => import('@/views/auth/split/new-pass')),
  },
  {
    path: '/auth/split/reset-pass',
    Component: lazy(() => import('@/views/auth/split/reset-pass')),
  },
  {
    path: '/auth/split/sign-in',
    Component: lazy(() => import('@/views/auth/split/sign-in')),
  },
  {
    path: '/auth/split/sign-up',
    Component: lazy(() => import('@/views/auth/split/sign-up')),
  },
  {
    path: '/auth/split/success-mail',
    Component: lazy(() => import('@/views/auth/split/success-mail')),
  },
  {
    path: '/auth/split/two-factor',
    Component: lazy(() => import('@/views/auth/split/two-factor')),
  },
  {
    path: '/auth/success-mail',
    Component: lazy(() => import('@/views/auth/basic/success-mail')),
  },
  {
    path: '/auth/two-factor',
    Component: lazy(() => import('@/views/auth/basic/two-factor')),
  },
  {
    path: '/error/400',
    Component: lazy(() => import('@/views/error/400')),
  },
  {
    path: '/error/401',
    Component: lazy(() => import('@/views/error/401')),
  },
  {
    path: '/error/403',
    Component: lazy(() => import('@/views/error/403')),
  },
  {
    path: '/error/404',
    Component: lazy(() => import('@/views/error/404')),
  },
  {
    path: '/error/408',
    Component: lazy(() => import('@/views/error/408')),
  },
  {
    path: '/error/500',
    Component: lazy(() => import('@/views/error/500')),
  },
  {
    path: '/error/maintenance',
    Component: lazy(() => import('@/views/error/maintenance')),
  },
]
