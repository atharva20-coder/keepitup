import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Briefcase, Building, Calendar, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AddApplicationDialog from '@/components/AddApplicationDialog';

interface Application {
  id: string;
  position_title: string;
  company_name?: string;
  application_date: string;
  status: string;
  location?: string;
  work_type?: string;
  salary_range?: string;
  companies?: {
    name: string;
  };
}

interface Stats {
  total: number;
  applied: number;
  interviews: number;
  offers: number;
  rejected: number;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, applied: 0, interviews: 0, offers: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);

  const statusColors: { [key: string]: string } = {
    applied: 'bg-blue-500',
    screening: 'bg-yellow-500',
    interview: 'bg-purple-500',
    offer: 'bg-green-500',
    rejected: 'bg-red-500',
    withdrawn: 'bg-gray-500',
  };

  const fetchApplications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('job_applications')
        .select(`
          *,
          companies (
            name
          )
        `)
        .eq('user_id', user.id)
        .order('application_date', { ascending: false });

      if (error) throw error;

      const apps = data || [];
      setApplications(apps);

      // Calculate stats
      const total = apps.length;
      const applied = apps.filter(app => app.status === 'applied').length;
      const interviews = apps.filter(app => app.status === 'interview').length;
      const offers = apps.filter(app => app.status === 'offer').length;
      const rejected = apps.filter(app => app.status === 'rejected').length;

      setStats({ total, applied, interviews, offers, rejected });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [user]);

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.position_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (app.companies?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleApplicationAdded = () => {
    fetchApplications();
    setShowAddDialog(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Job Tracker</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {user?.email}
            </span>
            <Button variant="outline" onClick={signOut} size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Applications</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.applied}</p>
                  <p className="text-xs text-muted-foreground">Applied</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.interviews}</p>
                  <p className="text-xs text-muted-foreground">Interviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.offers}</p>
                  <p className="text-xs text-muted-foreground">Offers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.rejected}</p>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex flex-1 gap-4 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by position or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="applied">Applied</SelectItem>
                <SelectItem value="screening">Screening</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="withdrawn">Withdrawn</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Application
          </Button>
        </div>

        {/* Applications List */}
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No applications found</h3>
              <p className="text-muted-foreground mb-4">
                {applications.length === 0 
                  ? "Start by adding your first job application!"
                  : "Try adjusting your search or filter criteria."
                }
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Application
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredApplications.map((app) => (
              <Card key={app.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold">{app.position_title}</h3>
                        <Badge 
                          variant="secondary" 
                          className={`text-white ${statusColors[app.status] || 'bg-gray-500'}`}
                        >
                          {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Building className="h-4 w-4" />
                          {app.companies?.name || 'Company not specified'}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(app.application_date).toLocaleDateString()}
                        </div>
                        {app.location && (
                          <span>{app.location}</span>
                        )}
                        {app.work_type && (
                          <Badge variant="outline" className="capitalize">
                            {app.work_type}
                          </Badge>
                        )}
                      </div>
                      
                      {app.salary_range && (
                        <p className="text-sm text-muted-foreground">
                          💰 {app.salary_range}
                        </p>
                      )}
                    </div>
                    
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AddApplicationDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onApplicationAdded={handleApplicationAdded}
      />
    </div>
  );
};

export default Dashboard;