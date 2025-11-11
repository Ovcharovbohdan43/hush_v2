import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, Alias } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function StatisticsPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAliases: 0,
    activeAliases: 0,
    inactiveAliases: 0,
    aliasesByDate: [] as { date: string; count: number }[],
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadStatistics();
  }, [isAuthenticated, navigate]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const response = await apiClient.listAliases();
      setAliases(response.aliases);

      // Calculate statistics
      const totalAliases = response.aliases.length;
      const activeAliases = response.aliases.filter((a) => a.status === 'active').length;
      const inactiveAliases = totalAliases - activeAliases;

      // Group aliases by creation date
      const aliasesByDateMap = new Map<string, number>();
      response.aliases.forEach((alias) => {
        const date = new Date(alias.created_at).toLocaleDateString();
        aliasesByDateMap.set(date, (aliasesByDateMap.get(date) || 0) + 1);
      });

      const aliasesByDate = Array.from(aliasesByDateMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setStats({
        totalAliases,
        activeAliases,
        inactiveAliases,
        aliasesByDate,
      });
    } catch (err: any) {
      console.error('Failed to load statistics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto p-4 max-w-6xl">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="grid gap-4 md:grid-cols-3 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Aliases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalAliases}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Aliases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.activeAliases}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Inactive Aliases
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">{stats.inactiveAliases}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Aliases Created Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.aliasesByDate.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.aliasesByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

