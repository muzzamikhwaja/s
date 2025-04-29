import { getLeads, Lead } from '@/services/crm';
import { categorizeLeads, CategorizeLeadsOutput } from '@/ai/flows/lead-scoring';
import { LeadDashboard } from '@/components/lead-dashboard';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { handleCallLeadAction, ActionResult } from '@/app/actions'; // Import action
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"


// Helper function for retrying promises with exponential backoff
async function retry<T>(fn: () => Promise<T>, retries = 3, delay = 1000, factor = 2): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Check if the error message indicates an overload or service unavailable
      if (error instanceof Error && (error.message.includes('503') || error.message.toLowerCase().includes('overloaded'))) {
        if (i < retries - 1) {
          const currentDelay = delay * Math.pow(factor, i);
          console.warn(`AI service overloaded. Retrying in ${currentDelay / 1000}s... (${i + 1}/${retries - 1})`);
          await new Promise(resolve => setTimeout(resolve, currentDelay));
        } else {
           console.error(`AI service failed after ${retries} attempts:`, lastError);
        }
      } else {
        // Don't retry for other errors
         console.error(`An unexpected error occurred during AI processing:`, error);
        break;
      }
    }
  }
   // Ensure lastError is always an Error object before throwing
   if (lastError instanceof Error) {
    throw lastError;
   } else {
     throw new Error('An unknown error occurred during retry attempts.');
   }
}


async function LeadsData() {
  let leads: Lead[] = [];
  let categorizedLeadsOutput: CategorizeLeadsOutput | null = null;
  let errorState: string | null = null;

  try {
    // Fetch leads from CRM
    leads = await getLeads();

    if (leads.length > 0) {
        // Categorize leads using the AI flow with retry logic
        categorizedLeadsOutput = await retry(() => categorizeLeads({ leads }));

        // --- Automatic Calling Logic ---
        const hotLeadIds = new Set(
            categorizedLeadsOutput.categorizedLeads
            .filter(cl => cl.category === 'hot')
            .map(cl => cl.id)
        );

        const hotLeadsToCall = leads.filter(lead => hotLeadIds.has(lead.id));

        console.log(`[Auto Call] Found ${hotLeadsToCall.length} hot leads to call.`);

        // Use Promise.allSettled to handle individual call failures without stopping others
        const callResults = await Promise.allSettled(
            hotLeadsToCall.map(lead =>
                handleCallLeadAction(lead.id, lead.phoneNumber)
                .catch(callError => ({ // Catch errors within the map to ensure allSettled gets results
                    status: 'rejected' as const, // Explicitly type status
                    reason: callError instanceof Error ? callError.message : 'Unknown call error'
                 }))
            )
        );


        callResults.forEach((result, index) => {
            const lead = hotLeadsToCall[index];
            if (result.status === 'fulfilled') {
                 // Check the ActionResult within the fulfilled promise
                 const actionResult = result.value as ActionResult; // Type assertion
                 console.log(`[Auto Call] Result for ${lead.name} (${lead.id}): ${actionResult.success ? 'Success' : 'Failure'} - ${actionResult.message}`);
                 // Optionally: Update CRM based on actionResult.success
            } else {
                // Handle rejected promises (errors during handleCallLeadAction)
                console.error(`[Auto Call] Error calling ${lead.name} (${lead.id}):`, result.reason);
            }
        });
        // --- End Automatic Calling Logic ---
     }

  } catch (error: any) {
    console.error("Error fetching or categorizing leads:", error);
    errorState = error.message || "An unexpected error occurred while processing leads.";
     // Ensure categorizedLeadsOutput is null or empty in case of error
    categorizedLeadsOutput = { categorizedLeads: [] };
    // Optionally set leads to empty if fetching failed, depending on desired behavior
    // leads = [];
  }

   if (errorState) {
    return (
        <div className="container mx-auto py-10">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {errorState} Please try refreshing the page. If the problem persists, the AI service might be temporarily unavailable.
              </AlertDescription>
            </Alert>
            {/* Optionally render a basic table structure even on error */}
             <div className="mt-6">
                 <LeadDashboard leads={leads} categorizedLeads={categorizedLeadsOutput?.categorizedLeads ?? []} />
             </div>
        </div>
    );
  }


  // Pass potentially empty/null data if error occurred before categorization finished but after fetch
  return <LeadDashboard leads={leads} categorizedLeads={categorizedLeadsOutput?.categorizedLeads ?? []} />;
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
