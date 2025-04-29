'use server';
/**
 * @fileOverview Categorizes leads as hot, warm, or cold based on engagement metrics.
 *
 * - categorizeLeads - A function that categorizes leads.
 * - CategorizeLeadsInput - The input type for the categorizeLeads function.
 * - CategorizeLeadsOutput - The return type for the categorizeLeads function.
 */

import {ai} from '@/ai/ai-instance';
import {Lead} from '@/services/crm';
import {z} from 'genkit';

const CategorizeLeadsInputSchema = z.object({
  leads: z
    .array(z.object({
      id: z.string(),
      name: z.string(),
      phoneNumber: z.string(),
      email: z.string(),
      notes: z.string().optional(),
      engagementScore: z.number(),
    }))
    .describe('An array of leads from the CRM.'),
});
export type CategorizeLeadsInput = z.infer<typeof CategorizeLeadsInputSchema>;

const CategorizeLeadsOutputSchema = z.object({
  categorizedLeads: z.array(
    z.object({
      id: z.string(),
      category: z.enum(['hot', 'warm', 'cold']).describe('The category of the lead.'),
      reason: z.string().describe('The reason for the categorization.'),
    })
  ),
});
export type CategorizeLeadsOutput = z.infer<typeof CategorizeLeadsOutputSchema>;

export async function categorizeLeads(input: CategorizeLeadsInput): Promise<CategorizeLeadsOutput> {
  return categorizeLeadsFlow(input);
}

const categorizeLeadsPrompt = ai.definePrompt({
  name: 'categorizeLeadsPrompt',
  input: {
    schema: z.object({
      leads: z
        .array(z.object({
          id: z.string(),
          name: z.string(),
          phoneNumber: z.string(),
          email: z.string(),
          notes: z.string().optional(),
          engagementScore: z.number(),
        }))
        .describe('An array of leads from the CRM.'),
    }),
  },
  output: {
    schema: z.object({
      categorizedLeads: z.array(
        z.object({
          id: z.string(),
          category: z.enum(['hot', 'warm', 'cold']).describe('The category of the lead.'),
          reason: z.string().describe('The reason for the categorization.'),
        })
      ),
    }),
  },
  prompt: `You are an AI expert in lead scoring and categorization.

You will receive a list of leads from a CRM. Analyze each lead based on their engagement score and any available notes to categorize them as "hot", "warm", or "cold".

Consider a lead "hot" if their engagement score is high (e.g., above 75) and/or if there are notes indicating recent positive interactions.
Consider a lead "warm" if their engagement score is moderate (e.g., between 25 and 75) and there are some indications of interest.
Consider a lead "cold" if their engagement score is low (e.g., below 25) and there are no recent interactions or indications of interest.

For each lead, provide a brief reason for the categorization.

Leads:\n{{#each leads}}
  - ID: {{this.id}}, Name: {{this.name}}, Engagement Score: {{this.engagementScore}}, Notes: {{this.notes}}\n{{/each}}

Output:
Categorized Leads: {{output.categorizedLeads}}
`,
});

const categorizeLeadsFlow = ai.defineFlow<
  typeof CategorizeLeadsInputSchema,
  typeof CategorizeLeadsOutputSchema
>({
  name: 'categorizeLeadsFlow',
  inputSchema: CategorizeLeadsInputSchema,
  outputSchema: CategorizeLeadsOutputSchema,
},
async input => {
  const {output} = await categorizeLeadsPrompt(input);
  return output!;
});
