export const DatePeriods = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const getStartOfWeek = (date) => {
      const diff = date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1);
      return new Date(date.setDate(diff));
  };

  const thisWeek = getStartOfWeek(new Date(today));
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisYear = new Date(today.getFullYear(), 0, 1);

  const formatDate = (date) => date.toISOString().split('T')[0];

  return {
      Today: {
          period: `${formatDate(today)}/${formatDate(today)}`,
          index: 0,
      },
      Yesterday: {
          period: `${formatDate(yesterday)}/${formatDate(yesterday)}`,
          index: 1,
      },
      'This Week': {
          period: `${formatDate(thisWeek)}/${formatDate(today)}`,
          index: 2,
      },
      'This Month': {
          period: `${formatDate(thisMonth)}/${formatDate(today)}`,
          index: 3,
      },
      'This Year': {
          period: `${formatDate(thisYear)}/${formatDate(today)}`,
          index: 4,
      },
  };
};