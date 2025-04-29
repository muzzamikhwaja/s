import { getLeads, Lead } from '@/services/crm';
import { categorizeLeads, CategorizeLeadsOutput } from '@/ai/flows/lead-scoring';
import { LeadDashboard } from '@/components/lead-dashboard';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { handleCallLeadAction, ActionResult } from '@/app/actions'; // Import action

async function LeadsData() {
  // Fetch leads from CRM
  const leads: Lead[] = await getLeads();

  // Categorize leads using the AI flow
  const categorizedLeadsOutput: CategorizeLeadsOutput = await categorizeLeads({ leads });

  // --- Automatic Calling Logic ---
  const hotLeadIds = new Set(
    categorizedLeadsOutput.categorizedLeads
      .filter(cl => cl.category === 'hot')
      .map(cl => cl.id)
  );

  const hotLeadsToCall = leads.filter(lead => hotLeadIds.has(lead.id));

  console.log(`[Auto Call] Found ${hotLeadsToCall.length} hot leads to call.`);

  const callPromises = hotLeadsToCall.map(lead =>
    handleCallLeadAction(lead.id, lead.phoneNumber)
  );

  const callResults = await Promise.allSettled(callPromises);

  callResults.forEach((result, index) => {
    const lead = hotLeadsToCall[index];
    if (result.status === 'fulfilled') {
      console.log(`[Auto Call] Result for ${lead.name} (${lead.id}): ${result.value.success ? 'Success' : 'Failure'} - ${result.value.message}`);
      // Optionally: Could update lead notes here if the action doesn't do it,
      // but it requires another CRM update call. For now, just logging.
    } else {
      console.error(`[Auto Call] Error calling ${lead.name} (${lead.id}):`, result.reason);
    }
  });
  // --- End Automatic Calling Logic ---


  // Note: We pass the original leads and categorization.
  // The dashboard will reflect the initial state. Manual actions are still possible.
  // If CRM updates were implemented in handleCallLeadAction and revalidation worked perfectly,
  // the dashboard *might* reflect updates, but it's safer to assume initial state display.
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
