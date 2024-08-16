const getLastWeekRange = () => {
  const today = new Date();
  const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
  
  // Calculate last Sunday
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() - currentDay - 7);
  
  // Calculate last Monday
  const lastMonday = new Date(lastSunday);
  lastMonday.setDate(lastSunday.getDate() - 6);
  
  // Format dates as ISO strings
  const startDate = lastMonday.toISOString().split('T')[0];
  const endDate = lastSunday.toISOString().split('T')[0];
  
  return { startDate, endDate };
};
export const  DatePeriods =() => {
    
    const today = new Date();

    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
        const getStartOfWeek = (date) => {
        const diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
        };


        
        const thisWeek = getStartOfWeek(new Date(today));
        const thisWeekEnd = new Date(thisWeek);
        thisWeekEnd.setDate(thisWeek.getDate() + 6);


    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const thisMonthStart = new Date(Math.max(thisMonth, thisWeek));

    const { startDate: lastWeekStart, endDate: lastWeekEnd } = getLastWeekRange();

    
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
    const thisYear = new Date(today.getFullYear(), 0, 1);
    const thisQuarter = new Date(today.getFullYear(), today.getMonth() - 3, today.getDate());
    const lastQuarter = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
    const formatDate = (date) => date.toISOString().split('T')[0];
    return {
        Today: {
          period: `${formatDate(today)}/${formatDate(today)}`,
          index: 0,
        },
      yesterday: {
        period: `${formatDate(yesterday)}/${formatDate(yesterday)}`,
        index: 1,
      },
   
        'This Week': {
          period: `${formatDate(thisWeek)}/${formatDate(today)}`,
          index: 2,
        },
        'Last Week': {
           period: `${lastWeekStart}/${lastWeekEnd}`,
          index: 3,
        },
        'This Month': {
          period: `${formatDate(thisMonthStart)}/${formatDate(today)}`,
          index: 4,
        },
        'Last Month': {
          period: `${formatDate(lastMonth)}/${formatDate(lastMonthEnd)}`,
          index: 5,
        },

      
        
        'This Year': {
          period: `${thisYear.toISOString().split('T')[0]}/${formatDate(today)}`,
          index: 6,
        },
      
      };
};






