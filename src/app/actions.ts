'use server';

import { callLead, CallResult } from '@/services/phone';
import { updateLead, Lead, getLeads } from '@/services/crm'; // Assuming updateLead exists
import { revalidatePath } from 'next/cache';

export type ActionResult = {
  success: boolean;
  message: string;
  callResult?: CallResult;
};

/**
 * Server action to handle calling a lead.
 * @param leadId The ID of the lead to call.
 * @param phoneNumber The phone number to call.
 * @returns A promise resolving to an ActionResult.
 */
export async function handleCallLeadAction(leadId: string, phoneNumber: string): Promise<ActionResult> {
  console.log(`Attempting to call lead ${leadId} at ${phoneNumber}`);
  try {
    const result = await callLead(phoneNumber);
    console.log(`Call result for lead ${leadId}:`, result);

    // Optionally update the lead notes in the CRM after the call
    // This requires fetching the lead first, then updating
    // For simplicity, we'll skip the fetch/update for now,
    // but you would typically do this:
    /*
    const leads = await getLeads(); // Assuming getLeads can fetch a single lead or all
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      const updatedLead = {
        ...lead,
        notes: `${lead.notes ? lead.notes + '\n' : ''}[${new Date().toISOString()}] Call attempt: ${result.status}. Notes: ${result.notes || 'N/A'}`,
      };
      await updateLead(updatedLead);
    }
    */

    revalidatePath('/'); // Revalidate the page to show updated data if CRM was updated

    return {
      success: result.status === 'success',
      message: result.status === 'success' ? `Successfully called ${phoneNumber}. ${result.notes || ''}` : `Failed to call ${phoneNumber}.`,
      callResult: result,
    };
  } catch (error) {
    console.error(`Error calling lead ${leadId}:`, error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return {
      success: false,
      message: `Error calling lead: ${message}`,
    };
  }
}


/**
 * Server action to handle re-nurturing a cold lead.
 * This currently simulates calling the lead again.
 * @param leadId The ID of the lead to re-nurture.
 * @param phoneNumber The phone number to call for re-nurturing.
 * @returns A promise resolving to an ActionResult.
 */
export async function handleReNurtureLeadAction(leadId: string, phoneNumber: string): Promise<ActionResult> {
    console.log(`Attempting to re-nurture cold lead ${leadId} by calling ${phoneNumber}`);
    try {
      // Simulate re-nurturing by making another call
      const result = await callLead(phoneNumber);
      console.log(`Re-nurture call result for lead ${leadId}:`, result);

      // Optionally update lead notes/status in CRM
      // Similar to handleCallLeadAction, fetch and update lead data
      /*
       const leads = await getLeads();
       const lead = leads.find(l => l.id === leadId);
       if (lead) {
           const updatedLead = { ...lead, notes: `${lead.notes || ''}\n[${new Date().toISOString()}] Re-nurture attempt: ${result.status}. Notes: ${result.notes || 'N/A'}` };
           await updateLead(updatedLead);
       }
      */

      revalidatePath('/'); // Revalidate if CRM was updated

      return {
        success: result.status === 'success',
        message: result.status === 'success' ? `Re-nurture initiated for ${phoneNumber}. ${result.notes || ''}` : `Failed to re-nurture ${phoneNumber}.`,
        callResult: result,
      };
    } catch (error) {
        console.error(`Error re-nurturing lead ${leadId}:`, error);
        const message = error instanceof Error ? error.message : 'An unknown error occurred';
        return {
            success: false,
            message: `Error re-nurturing lead: ${message}`,
        };
    }
}
