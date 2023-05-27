import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Transaction } from './Transaction';


interface ChartProps {
  transactions: Transaction[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const Charts: React.FC<ChartProps> = ({ transactions }) => {
  // Prepare data for bar chart
  const barData = prepareBarData(transactions);
  
  // Prepare data for pie chart
  const pieData = preparePieData(transactions);

  return (
    <div>
      <BarChart width={600} height={300} data={barData}>
        <XAxis dataKey="week" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="amount" fill="#8884d8" />
      </BarChart>

      <PieChart width={400} height={400}>
        <Pie
          data={pieData}
          cx={200}
          cy={200}
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
      </PieChart>
    </div>
  );
};

function prepareBarData(transactions: Transaction[]) {
  // TODO: Implement logic to group transactions by week
  return [];
}

function preparePieData(transactions: Transaction[]) {
  // TODO: Implement logic to group transactions by category
  return [];
}

export default Charts;
