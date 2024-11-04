export const Days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
export const getYears = (year) => {
  const years = [];
  const currentYear = new Date().getFullYear();
  const min = currentYear - 124;
  const max = new Date().getFullYear() + 10;

  for (let y = min; y < max; y++) {
    years.push(y);
  }

  return years;
};

export const Months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];
