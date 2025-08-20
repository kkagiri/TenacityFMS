import ScrollView from "devextreme-react/scroll-view";
import React, { useRef } from "react";
import { Header, Footer } from "../../components";
import "./app-drawer-layout.scss";

export default function AppDrawerLayout({ title, children }) {
  const scrollViewRef = useRef(null);

  return (
    <div className={"app-drawer-layout"}>
      <Header
        title={title}
      />
      <div className={"main-content"}>
        <ScrollView ref={scrollViewRef} className={"layout-body with-footer"}>
          <div className={"content"}>
            {React.Children.map(children, (item) => {
              return item.type !== Footer && item;
            })}
          </div>
          <div className={"content-block"}>
            {React.Children.map(children, (item) => {
              return item.type === Footer && item;
            })}
          </div>
        </ScrollView>
      </div>
    </div>
  );
}
