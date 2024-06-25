import { Routes, Route, Navigate } from 'react-router-dom';
import React, { useEffect, useMemo } from 'react';
import appInfo from './app-info';
import { SideNavInnerToolbar as SideNavBarLayout } from './layouts';
import { Footer } from './components';
import routes from './app-routes';


import { useDispatch, useSelector } from 'react-redux';
import { fetchNavigationItems } from './actions/navigationActions';
import resolvedComponents from './app-routes';
import withRoleProtection from './utils/withRoleProtection';
import Unauthorized from './pages/unauthorized';

export default function Content() {
  const dispatch = useDispatch();
  const { navigationItems } = useSelector((state) => state.navigation);
  const { user } = useSelector((state) => state.auth);


  useEffect(() => {
    if (user) {
      dispatch(fetchNavigationItems());
    }
  }, [user, dispatch]);

  const dynamicRoutes = useMemo(() => {
    return navigationItems.map((item) => {
      const Component = resolvedComponents(item.page);
      const ProtectedComponent = withRoleProtection(Component, item.roles);
      return (
        <Route
          key={item.link}
          path={item.link}
          element={<ProtectedComponent />}
        />
      );
    });
  }, [navigationItems]);

  return (
    <SideNavBarLayout title={appInfo.title}>
      <Routes>
        {dynamicRoutes}
        <Route path='/unauthorized' element={<Unauthorized />} />

        <Route
          path='*'
          element={<Navigate to='/home' />}
        />

      </Routes>
      <Footer>
        Copyright © 2011-{new Date().getFullYear()} {appInfo.title} Inc.
        <br />
        Develop  by Kevin.kagiri@hyoung.co.ke. All trademarks or registered trademarks are property of Hyoung EA Co. Ltd.
      </Footer>
    </SideNavBarLayout>
  );
}



// export default function Content() {
//   return (
//     <SideNavBarLayout title={appInfo.title}>
//       <Routes>
//         {routes.map(({ path, element }) => (
//           <Route
//             key={path}
//             path={path}
//             element={element}
//           />
//         ))}
//         <Route
//           path='*'
//           element={<Navigate to='/home' />}
//         />
//       </Routes>
//       <Footer>
//         Copyright © 2011-{new Date().getFullYear()} {appInfo.title} Inc.
//         <br />
//        Develop  by Kevin.kagiri@hyoung.co.ke All trademarks or registered trademarks are property of Hyoung EA Co. Ltd. 
//       </Footer>
//     </SideNavBarLayout>
//   );
// }
