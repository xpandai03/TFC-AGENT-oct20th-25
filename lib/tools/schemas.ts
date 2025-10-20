import { z } from 'zod'

/**
 * Schema for writeStatusToContact tool
 * Updates a client's status in the Excel sheet
 */
export const writeStatusSchema = z.object({
  patientName: z.string().describe('Full name of the client'),
  status: z.string().describe('New status value (e.g. "Ready for Intake", "Waitlist", "Active")'),
  editor: z.string().describe('Name of the admin performing the update. Use "D.A.W.N." if not specified.'),
})

/**
 * Schema for addNoteToContact tool
 * Adds a note to a client's record
 */
export const addNoteSchema = z.object({
  patientName: z.string().describe('Full name of the client'),
  note: z.string().describe('Note content to add to client record'),
  editor: z.string().describe('Name of the admin adding the note. Use "D.A.W.N." if not specified.'),
})

export type WriteStatusParams = z.infer<typeof writeStatusSchema>
export type AddNoteParams = z.infer<typeof addNoteSchema>
