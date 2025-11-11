import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient, Alias } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Trash2, Plus, Mail, Settings, LogOut, Copy, Check, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export function Dashboard() {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [filteredAliases, setFilteredAliases] = useState<Alias[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [aliasType, setAliasType] = useState<'random' | 'custom' | 'temporary'>('random');
  const [customAlias, setCustomAlias] = useState('');
  const [ttlMinutes, setTtlMinutes] = useState(60);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadAliases();
  }, [isAuthenticated, navigate]);

  const loadAliases = async () => {
    try {
      setLoading(true);
      const response = await apiClient.listAliases();
      setAliases(response.aliases);
      setFilteredAliases(response.aliases);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load aliases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = aliases;

    // Фильтр по статусу
    if (statusFilter !== 'all') {
      filtered = filtered.filter((alias) => alias.status === statusFilter);
    }

    // Фильтр по поисковому запросу
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((alias) =>
        alias.address.toLowerCase().includes(query)
      );
    }

    setFilteredAliases(filtered);
  }, [aliases, searchQuery, statusFilter]);

  const handleCreateAlias = async () => {
    try {
      setCreating(true);
      const data: any = { alias_type: aliasType };
      if (aliasType === 'custom') {
        if (!customAlias.trim()) {
          toast.error('Custom alias is required');
          return;
        }
        data.custom = customAlias.trim();
      }
      if (aliasType === 'temporary') {
        data.ttl_minutes = ttlMinutes;
      }

      await apiClient.createAlias(data);
      toast.success('Alias created successfully');
      setCreateDialogOpen(false);
      setCustomAlias('');
      setAliasType('random');
      loadAliases();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create alias');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteAlias = async (id: string) => {
    if (!confirm('Are you sure you want to delete this alias?')) return;
    try {
      await apiClient.deleteAlias(id);
      toast.success('Alias deleted');
      loadAliases();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete alias');
    }
  };

  const handleToggleAlias = async (id: string) => {
    try {
      await apiClient.toggleAlias(id);
      toast.success('Alias toggled');
      loadAliases();
    } catch (err: any) {
      toast.error(err.message || 'Failed to toggle alias');
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Manage your email aliases</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/target-email')}>
              <Settings className="mr-2 h-4 w-4" />
              Target Email
            </Button>
            <Button variant="outline" onClick={() => navigate('/statistics')}>
              Statistics
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search aliases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Create Alias Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mb-6">
              <Plus className="mr-2 h-4 w-4" />
              Create Alias
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Alias</DialogTitle>
              <DialogDescription>Choose the type of alias you want to create</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Alias Type</Label>
                <Select value={aliasType} onValueChange={(v: any) => setAliasType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="random">Random</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                    <SelectItem value="temporary">Temporary</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {aliasType === 'custom' && (
                <div className="space-y-2">
                  <Label>Custom Alias</Label>
                  <Input
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    placeholder="my-alias"
                  />
                </div>
              )}

              {aliasType === 'temporary' && (
                <div className="space-y-2">
                  <Label>TTL (minutes)</Label>
                  <Input
                    type="number"
                    value={ttlMinutes}
                    onChange={(e) => setTtlMinutes(parseInt(e.target.value) || 60)}
                    min={1}
                  />
                </div>
              )}

              <Button onClick={handleCreateAlias} className="w-full" disabled={creating}>
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Aliases List */}
        {filteredAliases.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {aliases.length === 0 ? 'No aliases yet' : 'No aliases match your filters'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {aliases.length === 0
                  ? 'Create your first alias to get started'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {aliases.length === 0 && (
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Alias
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredAliases.map((alias) => (
              <Card key={alias.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <code className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">
                          {alias.address}
                        </code>
                        <Badge variant={alias.status === 'active' ? 'default' : 'secondary'}>
                          {alias.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Created: {new Date(alias.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(alias.address, alias.id)}
                      >
                        {copiedId === alias.id ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAlias(alias.id)}
                      >
                        {alias.status === 'active' ? 'Disable' : 'Enable'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/aliases/${alias.id}/logs`)}
                      >
                        Logs
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAlias(alias.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

