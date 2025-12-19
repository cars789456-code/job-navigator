import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface JobAnalytics {
  jobId: string;
  jobTitle: string;
  totalApplications: number;
  pending: number;
  reviewed: number;
  interview: number;
  rejected: number;
  hired: number;
  conversionRate: number;
  avgResponseTime: number; // in hours
}

export interface OverviewStats {
  totalJobs: number;
  totalApplications: number;
  overallConversionRate: number;
  avgResponseTime: number;
  applicationsByStatus: {
    pending: number;
    reviewed: number;
    interview: number;
    rejected: number;
    hired: number;
  };
  applicationsTrend: {
    date: string;
    count: number;
  }[];
}

export function useCompanyAnalytics() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['company-analytics', user?.id],
    queryFn: async (): Promise<{ jobs: JobAnalytics[]; overview: OverviewStats }> => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get user's company
      const { data: companyData } = await supabase
        .rpc('get_user_company', { _user_id: user.id });

      if (!companyData) {
        return {
          jobs: [],
          overview: {
            totalJobs: 0,
            totalApplications: 0,
            overallConversionRate: 0,
            avgResponseTime: 0,
            applicationsByStatus: { pending: 0, reviewed: 0, interview: 0, rejected: 0, hired: 0 },
            applicationsTrend: [],
          },
        };
      }

      // Get all jobs for the company
      const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('id, title, created_at')
        .eq('company_id', companyData);

      if (jobsError) throw jobsError;

      if (!jobs || jobs.length === 0) {
        return {
          jobs: [],
          overview: {
            totalJobs: 0,
            totalApplications: 0,
            overallConversionRate: 0,
            avgResponseTime: 0,
            applicationsByStatus: { pending: 0, reviewed: 0, interview: 0, rejected: 0, hired: 0 },
            applicationsTrend: [],
          },
        };
      }

      // Get all applications for these jobs
      const jobIds = jobs.map(j => j.id);
      const { data: applications, error: appsError } = await supabase
        .from('applications')
        .select('*')
        .in('job_id', jobIds);

      if (appsError) throw appsError;

      const apps = applications || [];

      // Calculate analytics per job
      const jobAnalytics: JobAnalytics[] = jobs.map(job => {
        const jobApps = apps.filter(a => a.job_id === job.id);
        const statusCounts = {
          pending: jobApps.filter(a => a.status === 'pending').length,
          reviewed: jobApps.filter(a => a.status === 'reviewed').length,
          interview: jobApps.filter(a => a.status === 'interview').length,
          rejected: jobApps.filter(a => a.status === 'rejected').length,
          hired: jobApps.filter(a => a.status === 'hired').length,
        };

        const total = jobApps.length;
        const conversionRate = total > 0 ? (statusCounts.hired / total) * 100 : 0;

        // Calculate average response time (time from created_at to updated_at for non-pending)
        const respondedApps = jobApps.filter(a => a.status !== 'pending');
        let avgResponseTime = 0;
        if (respondedApps.length > 0) {
          const totalHours = respondedApps.reduce((acc, app) => {
            const created = new Date(app.created_at).getTime();
            const updated = new Date(app.updated_at).getTime();
            return acc + (updated - created) / (1000 * 60 * 60);
          }, 0);
          avgResponseTime = totalHours / respondedApps.length;
        }

        return {
          jobId: job.id,
          jobTitle: job.title,
          totalApplications: total,
          ...statusCounts,
          conversionRate,
          avgResponseTime,
        };
      });

      // Calculate overview stats
      const totalApplications = apps.length;
      const overallStatusCounts = {
        pending: apps.filter(a => a.status === 'pending').length,
        reviewed: apps.filter(a => a.status === 'reviewed').length,
        interview: apps.filter(a => a.status === 'interview').length,
        rejected: apps.filter(a => a.status === 'rejected').length,
        hired: apps.filter(a => a.status === 'hired').length,
      };

      const overallConversionRate = totalApplications > 0 
        ? (overallStatusCounts.hired / totalApplications) * 100 
        : 0;

      const allRespondedApps = apps.filter(a => a.status !== 'pending');
      let overallAvgResponseTime = 0;
      if (allRespondedApps.length > 0) {
        const totalHours = allRespondedApps.reduce((acc, app) => {
          const created = new Date(app.created_at).getTime();
          const updated = new Date(app.updated_at).getTime();
          return acc + (updated - created) / (1000 * 60 * 60);
        }, 0);
        overallAvgResponseTime = totalHours / allRespondedApps.length;
      }

      // Calculate applications trend (last 30 days)
      const last30Days: { date: string; count: number }[] = [];
      const now = new Date();
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = apps.filter(a => a.created_at.split('T')[0] === dateStr).length;
        last30Days.push({ date: dateStr, count });
      }

      return {
        jobs: jobAnalytics,
        overview: {
          totalJobs: jobs.length,
          totalApplications,
          overallConversionRate,
          avgResponseTime: overallAvgResponseTime,
          applicationsByStatus: overallStatusCounts,
          applicationsTrend: last30Days,
        },
      };
    },
    enabled: !!user?.id,
  });
}
