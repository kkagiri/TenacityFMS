import React, { useEffect } from 'react';
import './TickerCard.scss';


export const TickerCard = (props) => {
  const { title, icon, tone, value, percentage, formatValue = (value) => `${value}` } = props;
  useEffect(() => {
    console.log('props', tone);
  }, [props]);

  return (
    <div className={'ticker ${tone}'}>
      <div className="icon-wrapper">
      {icon && <i className={icon} />}
            </div>
      <div className='middle'>
        <div className='title'>
          {title}
        </div>
        <div className='total'>
          {formatValue(value)}
        </div>
      </div>
      {/* <div className={`percentage ${percentage > 0 ? 'positive' : 'negative'}`}>
        <i className={`fa-light fa-${percentage > 0 ? 'arrow-up' : 'arrow-down'}`} />
        <div className='value'>{`${Math.abs(percentage)}%`}</div>
      </div> */}
    </div>
  );
};
