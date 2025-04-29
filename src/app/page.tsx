import { getLeads } from '@/services/crm';
import { categorizeLeads } from '@/ai/flows/lead-scoring';
import { LeadDashboard } from '@/components/lead-dashboard';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton

async function LeadsData() {
  // Fetch leads from CRM
  const leads = await getLeads();

  // Categorize leads using the AI flow
  const categorizedLeadsOutput = await categorizeLeads({ leads });

  return <LeadDashboard leads={leads} categorizedLeads={categorizedLeadsOutput.categorizedLeads} />;
}


function LoadingSkeleton() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">
        <Skeleton className="h-8 w-1/3" />
      </h1>
      <div className="rounded-lg border shadow-sm overflow-hidden">
        <div className="p-4">
          <Skeleton className="h-10 w-full mb-4" /> {/* Header Skeleton */}
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-12 w-full mb-2" /> /* Row Skeleton */
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <LeadsData />
    </Suspense>
  );
}
