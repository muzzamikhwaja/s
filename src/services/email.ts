/**
 * Represents the result of sending an email.
 */
export interface EmailResult {
  /**
   * The status of the email.
   */
  status: 'success' | 'failure';
  /**
   * Notes from the email.
   */
  notes?: string;
}

/**
 * Sends an email to a lead.
 * @param lead The lead to send an email to.
 * @param subject The subject of the email.
 * @param body The body of the email.
 * @returns A promise that resolves to an EmailResult object.
 */
export async function sendEmail(email: string, subject: string, body: string): Promise<EmailResult> {
  // TODO: Implement this by calling the email API.
  console.log(`Simulating sending email to lead with email ${email}.`);
  return {
    status: 'success',
    notes: 'Sent the lead a follow-up email.',
  };
}
