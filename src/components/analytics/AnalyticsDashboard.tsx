import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCompanyAnalytics } from '@/hooks/useAnalytics';
import { Loader2, TrendingUp, Users, Clock, Briefcase, CheckCircle, XCircle, Eye, UserCheck } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

const STATUS_COLORS = {
  pending: 'hsl(38, 92%, 50%)',
  reviewed: 'hsl(217, 91%, 55%)',
  interview: 'hsl(280, 65%, 60%)',
  rejected: 'hsl(0, 84%, 60%)',
  hired: 'hsl(142, 71%, 45%)',
};

const STATUS_LABELS = {
  pending: 'Pendente',
  reviewed: 'Analisado',
  interview: 'Entrevista',
  rejected: 'Rejeitado',
  hired: 'Contratado',
};

export function AnalyticsDashboard() {
  const { data, isLoading, error } = useCompanyAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6">
          <p className="text-destructive">Erro ao carregar analytics: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.overview.totalJobs === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            Nenhuma vaga encontrada. Crie vagas para visualizar analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const { overview, jobs } = data;

  const pieData = Object.entries(overview.applicationsByStatus).map(([status, count]) => ({
    name: STATUS_LABELS[status as keyof typeof STATUS_LABELS],
    value: count,
    color: STATUS_COLORS[status as keyof typeof STATUS_COLORS],
  }));

  const barData = jobs.slice(0, 10).map(job => ({
    name: job.jobTitle.length > 20 ? job.jobTitle.substring(0, 20) + '...' : job.jobTitle,
    candidaturas: job.totalApplications,
    contratados: job.hired,
  }));

  const lineData = overview.applicationsTrend.map(item => ({
    date: new Date(item.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    candidaturas: item.count,
  }));

  const chartConfig = {
    candidaturas: { label: 'Candidaturas', color: 'hsl(217, 91%, 55%)' },
    contratados: { label: 'Contratados', color: 'hsl(142, 71%, 45%)' },
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold">Analytics</h2>
        <p className="text-muted-foreground">Acompanhe o desempenho das suas vagas</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vagas Ativas</p>
                <p className="text-3xl font-bold">{overview.totalJobs}</p>
              </div>
              <Briefcase className="w-10 h-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Candidaturas</p>
                <p className="text-3xl font-bold">{overview.totalApplications}</p>
              </div>
              <Users className="w-10 h-10 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                <p className="text-3xl font-bold">{overview.overallConversionRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-10 h-10 text-success opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio Resposta</p>
                <p className="text-3xl font-bold">
                  {overview.avgResponseTime < 24 
                    ? `${overview.avgResponseTime.toFixed(0)}h`
                    : `${(overview.avgResponseTime / 24).toFixed(1)}d`}
                </p>
              </div>
              <Clock className="w-10 h-10 text-warning opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card className="border-l-4 border-l-warning">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-warning" />
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-xl font-bold">{overview.applicationsByStatus.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-primary">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Analisados</p>
                <p className="text-xl font-bold">{overview.applicationsByStatus.reviewed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-xs text-muted-foreground">Entrevistas</p>
                <p className="text-xl font-bold">{overview.applicationsByStatus.interview}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-5 h-5 text-destructive" />
              <div>
                <p className="text-xs text-muted-foreground">Rejeitados</p>
                <p className="text-xl font-bold">{overview.applicationsByStatus.rejected}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-success">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-success" />
              <div>
                <p className="text-xs text-muted-foreground">Contratados</p>
                <p className="text-xl font-bold">{overview.applicationsByStatus.hired}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Applications Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Candidaturas nos Últimos 30 Dias</CardTitle>
            <CardDescription>Tendência de candidaturas recebidas</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="date" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line 
                  type="monotone" 
                  dataKey="candidaturas" 
                  stroke="hsl(217, 91%, 55%)" 
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>Como as candidaturas estão distribuídas</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Applications per Job */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Candidaturas por Vaga</CardTitle>
            <CardDescription>Top 10 vagas com mais candidaturas</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px]">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  width={150}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="candidaturas" fill="hsl(217, 91%, 55%)" radius={4} />
                <Bar dataKey="contratados" fill="hsl(142, 71%, 45%)" radius={4} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes por Vaga</CardTitle>
          <CardDescription>Métricas detalhadas de cada vaga</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-3 font-medium">Vaga</th>
                  <th className="text-center p-3 font-medium">Total</th>
                  <th className="text-center p-3 font-medium">Pendentes</th>
                  <th className="text-center p-3 font-medium">Entrevistas</th>
                  <th className="text-center p-3 font-medium">Contratados</th>
                  <th className="text-center p-3 font-medium">Conversão</th>
                  <th className="text-center p-3 font-medium">Tempo Resp.</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.jobId} className="border-b border-border hover:bg-muted/50">
                    <td className="p-3 font-medium">{job.jobTitle}</td>
                    <td className="p-3 text-center">{job.totalApplications}</td>
                    <td className="p-3 text-center text-warning">{job.pending}</td>
                    <td className="p-3 text-center text-purple-500">{job.interview}</td>
                    <td className="p-3 text-center text-success">{job.hired}</td>
                    <td className="p-3 text-center">{job.conversionRate.toFixed(1)}%</td>
                    <td className="p-3 text-center">
                      {job.avgResponseTime < 24 
                        ? `${job.avgResponseTime.toFixed(0)}h`
                        : `${(job.avgResponseTime / 24).toFixed(1)}d`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
