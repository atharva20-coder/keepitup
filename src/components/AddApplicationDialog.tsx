import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface Company {
  id: string;
  name: string;
}

interface AddApplicationDialogProps {
  open: boolean;
  onClose: () => void;
  onApplicationAdded: () => void;
}

const AddApplicationDialog = ({ open, onClose, onApplicationAdded }: AddApplicationDialogProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  
  const [formData, setFormData] = useState({
    position_title: '',
    company_id: '',
    new_company_name: '',
    application_date: new Date().toISOString().split('T')[0],
    status: 'applied',
    location: '',
    work_type: '',
    salary_range: '',
    job_description: '',
    notes: '',
  });

  useEffect(() => {
    if (open && user) {
      fetchCompanies();
    }
  }, [open, user]);

  const fetchCompanies = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    
    try {
      let companyId = formData.company_id;
      
      // Create new company if needed
      if (!companyId && formData.new_company_name) {
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({
            user_id: user.id,
            name: formData.new_company_name,
          })
          .select()
          .single();

        if (companyError) throw companyError;
        companyId = newCompany.id;
      }

      // Create job application
      const { error: applicationError } = await supabase
        .from('job_applications')
        .insert({
          user_id: user.id,
          company_id: companyId || null,
          position_title: formData.position_title,
          job_description: formData.job_description || null,
          application_date: formData.application_date,
          status: formData.status,
          location: formData.location || null,
          work_type: formData.work_type || null,
          salary_range: formData.salary_range || null,
          notes: formData.notes || null,
        });

      if (applicationError) throw applicationError;

      toast({
        title: "Success",
        description: "Job application added successfully!",
      });

      // Reset form
      setFormData({
        position_title: '',
        company_id: '',
        new_company_name: '',
        application_date: new Date().toISOString().split('T')[0],
        status: 'applied',
        location: '',
        work_type: '',
        salary_range: '',
        job_description: '',
        notes: '',
      });

      onApplicationAdded();
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

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Job Application</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="position_title">Position Title *</Label>
              <Input
                id="position_title"
                value={formData.position_title}
                onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                placeholder="e.g. Software Engineer"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="application_date">Application Date</Label>
              <Input
                id="application_date"
                type="date"
                value={formData.application_date}
                onChange={(e) => setFormData({ ...formData, application_date: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Company</Label>
            <Select 
              value={formData.company_id} 
              onValueChange={(value) => setFormData({ ...formData, company_id: value, new_company_name: '' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select existing company or add new below" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="space-y-2">
              <Label htmlFor="new_company_name">Or Add New Company</Label>
              <Input
                id="new_company_name"
                value={formData.new_company_name}
                onChange={(e) => setFormData({ ...formData, new_company_name: e.target.value, company_id: '' })}
                placeholder="Company name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="work_type">Work Type</Label>
              <Select value={formData.work_type} onValueChange={(value) => setFormData({ ...formData, work_type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select work type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g. San Francisco, CA"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="salary_range">Salary Range</Label>
            <Input
              id="salary_range"
              value={formData.salary_range}
              onChange={(e) => setFormData({ ...formData, salary_range: e.target.value })}
              placeholder="e.g. $80,000 - $120,000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="job_description">Job Description</Label>
            <Textarea
              id="job_description"
              value={formData.job_description}
              onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
              placeholder="Paste the job description here..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes about this application..."
              rows={3}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Adding...' : 'Add Application'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddApplicationDialog;