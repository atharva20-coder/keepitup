import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Filter, Briefcase, Building, Calendar, LogOut } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import AddApplicationDialog from '@/components/AddApplicationDialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
    SidebarFooter,
    SidebarInset,
} from '@/components/ui/sidebar';

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
        <div className="flex min-h-screen">
            <Sidebar>
                <SidebarHeader>
                    <div className="flex items-center gap-2">
                        <Briefcase className="h-6 w-6 text-primary" />
                        <h1 className="text-xl font-bold">Keepitup</h1>
                    </div>
                </SidebarHeader>
                <SidebarContent>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton isActive>
                                <Briefcase />
                                Applications
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarContent>
                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton onClick={signOut}>
                                <LogOut />
                                Sign Out
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
            </Sidebar>
            <SidebarInset>
                <main className="container mx-auto px-4 py-8 space-y-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold">Dashboard</h1>
                            <p className="text-muted-foreground">Welcome back, {user?.email}</p>
                        </div>
                        <Button onClick={() => setShowAddDialog(true)} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Add Application
                        </Button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Applied</CardTitle>
                                <div className="w-3 h-3 rounded-full bg-blue-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.applied}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Interviews</CardTitle>
                                <div className="w-3 h-3 rounded-full bg-purple-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.interviews}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Offers</CardTitle>
                                <div className="w-3 h-3 rounded-full bg-green-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.offers}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Rejected</CardTitle>
                                <div className="w-3 h-3 rounded-full bg-red-500" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.rejected}</div>
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
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="applied">Applied</SelectItem>
                                    <SelectItem value="screening">Screening</SelectItem>
                                    <SelectItem value="interview">Interview</SelectItem>
                                    <SelectItem value="offer">Offer</SelectItem>
                                    <SelectItem value="rejected">Rejected</SelectItem>
                                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
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
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Position</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Date Applied</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Work Type</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredApplications.map((app) => (
                                        <TableRow key={app.id}>
                                            <TableCell className="font-medium">{app.position_title}</TableCell>
                                            <TableCell>{app.companies?.name || 'N/A'}</TableCell>
                                            <TableCell>{new Date(app.application_date).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="secondary"
                                                    className={`text-white ${statusColors[app.status] || 'bg-gray-500'}`}
                                                >
                                                    {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {app.work_type && (
                                                    <Badge variant="outline" className="capitalize">
                                                        {app.work_type}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm">
                                                    View
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    )}
                </main>
                <AddApplicationDialog
                    open={showAddDialog}
                    onClose={() => setShowAddDialog(false)}
                    onApplicationAdded={handleApplicationAdded}
                />
            </SidebarInset>
        </div>
    );
};

export default Dashboard;
