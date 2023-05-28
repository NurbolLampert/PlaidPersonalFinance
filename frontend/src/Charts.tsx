import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Transaction } from './Transaction';
import styles from './charts.module.scss';


interface ChartProps {
  transactions: Transaction[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Charts: React.FC<ChartProps> = ({ transactions }) => {
  // Prepare data for bar chart
  const barData = prepareBarData(transactions);

  console.log(barData);
  
  // Prepare data for pie chart
  const pieData = preparePieData(transactions);

  console.log(pieData);

  return (
    <div className={styles.container}>
      <div className={styles.barChart}>
        <BarChart width={800} height={400} data={barData}>
          <XAxis dataKey="week" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="amount" fill="#008000" />
        </BarChart>
      </div>
      
      <div className={styles.pieChart}>
        <PieChart width={600} height={600}>
          <Pie
            data={pieData}
            cx={300}
            cy={300}
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={150}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
        </PieChart>
      </div>
    </div>
  );
};


function prepareBarData(transactions: Transaction[]) {
  const weeks: {[key: string]: number} = {};

  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const week = getWeekNumber(date);

    if (!weeks[week]) {
      weeks[week] = 0;
    }

    weeks[week] -= transaction.amount;
  });

  return Object.entries(weeks).map(([week, amount]) => ({ week, amount }));
}

function preparePieData(transactions: Transaction[]) {
  const categories: {[key: string]: number} = {};

  transactions.forEach(transaction => {
    transaction.category.forEach(category => {
      if (transaction.amount < 0) {
        return;
      }

      if (!categories[category]) {
        categories[category] = 0;
      }

      categories[category] += transaction.amount;
    });
  });

  return Object.entries(categories).map(([name, value]) => ({ name, value }));
}


function getWeekNumber(d: Date) {
  // Copy date so don't modify original
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  // Get first day of year
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  // Calculate full weeks to nearest Thursday
  var weekNo = Math.ceil(( ( (d.valueOf() - yearStart.valueOf()) / 86400000) + 1)/7);
  // Return array of year and week number
  return `${d.getUTCFullYear()}-W${weekNo}`;
}

export default Charts;