import React, { useState, createContext, useContext, useEffect } from 'react';
import { fetchNavigationItems } from '../actions/navigationActions';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRoles } from '../actions/roleActions';

const NavigationContext = createContext({});
const useNavigation = () => useContext(NavigationContext);

function NavigationProvider(props) {
  const [navigationData, setNavigationData] = useState({ currentPath: '' });

  return (
    <NavigationContext.Provider
      value={{ navigationData, setNavigationData }}
      {...props}
    />
  );
}

function withNavigationWatcher(Component, path) {
  const WrappedComponent = function (props) {
    const { setNavigationData } = useNavigation();

    useEffect(() => {
      setNavigationData({ currentPath: path });
    }, [path, setNavigationData]);

    return <Component {...props} />;
  }
  return <WrappedComponent />;
}

export {
  NavigationProvider,
  useNavigation,
  withNavigationWatcher
}