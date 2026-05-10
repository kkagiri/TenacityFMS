import React, { ReactNode } from 'react';
import './CardAnalytics.scss';



export const CardAnalytics = ({
    title,
    contentClass,
    isLoading = false,
    children,
    additionalHeaderContent,
    menuVisible = true

}) => {

    return (
        <div className={`card ${contentClass}`}>
    <div className='header'>
      {title && <div className='title'>{title}</div>}
      {additionalHeaderContent}
    </div>
    {!isLoading && <div className='card-contents'>{children}</div>}
  </div>
    );
}