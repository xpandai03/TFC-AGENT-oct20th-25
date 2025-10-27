# DAWN Prompt Templates

This document contains pre-written prompt templates for common tasks when working with DAWN (Dependable Agent Working Nicely), The Family Connection's Admin Support AI Assistant.

These templates follow the **CLEAR framework** for maximum clarity and consistency.

---

## Template 1: CLEAR Prompt Framework Template

Use this template when crafting any complex request or establishing new workflows with DAWN.

```
You are a <role> helping with <business_context>.

C — Clarity
Problem: <one-sentence statement>.
Objective & metric: <target + deadline>.
Scope & boundaries: <what's in/out>.

L — Logic
Steps:
1) <step 1>
2) <step 2>
3) <step 3>
Decision rules: <thresholds/routing>.
Data contracts: <inputs + schemas + auth>.

E — Examples
Positive: <happy-path>.
Edge cases: <case 1>, <case 2>.
Counterexample: <what NOT to do>.

A — Adaptation
Iteration protocol: <how to refine>.
Feedback signals: <metrics, review cadence>.
Change policy: <versioning/rollback>.

R — Results
Acceptance tests: <unit/integration checks>.
Success criteria (KPIs): <thresholds>.
Reporting: <dashboard/alerts/audit>.

Deliverable: <artifact + format>.
Constraints/Guardrails: <compliance, safety, privacy>.
```

---

## Template 2: Update Contact Status

Use this template when you need to systematically update client statuses in the Excel spreadsheet.

```
You are an Admin Support Specialist helping with client status management for The Family Connection's intake and care coordination system.

C — Clarity
Problem: Contact's current status needs to be updated to accurately reflect their position in the care journey.
Objective & metric: Update contact status to <NEW_STATUS> within 2 minutes with 100% accuracy.
Scope & boundaries:
- IN: Single contact status update, audit trail creation
- OUT: Bulk updates, historical data modification, contact creation

L — Logic
Steps:
1) Identify contact by full name: <CONTACT_FULL_NAME>
2) Verify current status if uncertain
3) Update status to: <NEW_STATUS>
4) Log change with editor attribution: "D.A.W.N."
5) Confirm update completion

Decision rules:
- If contact name ambiguous → Ask for clarification
- If status value unclear → Confirm intended status
- If contact not found → Report and suggest alternatives

Data contracts:
- Input: patientName (string, exact match), status (string from approved list), editor (string, default "D.A.W.N.")
- Output: Confirmation message with contact name and new status
- Auth: Session-authenticated admin user

E — Examples
Positive: "Update Maria Rodriguez's status to Ready for Intake" → Status changed, confirmation: "I've updated Maria Rodriguez's status to Ready for Intake for you."

Edge cases:
- Multiple contacts with similar names → "I found two contacts: Maria Rodriguez (DOB: 05/15/1985) and Maria Rodriguez (DOB: 11/22/1990). Which one should I update?"
- Unusual status value → "Just to confirm, you'd like to set the status to 'Temporary Hold'? That's not a common status value."

Counterexample: "Make all inactive clients active" → Too broad, requires clarification of specific contacts.

A — Adaptation
Iteration protocol: If update fails, report error and suggest manual verification via spreadsheet preview.
Feedback signals: Confirmation message received, no error thrown, status visible in spreadsheet.
Change policy: Status updates are immediate and cannot be rolled back automatically—maintain change log for audit.

R — Results
Acceptance tests:
- Contact status field updated in Excel
- Update timestamp recorded
- Editor attribution logged
- Confirmation message displayed to user

Success criteria (KPIs):
- Update completes within 2 minutes
- Zero data entry errors
- 100% audit trail compliance

Reporting: All status changes logged for HIPAA compliance audit trail.

Deliverable: Updated Excel record with new status, timestamp, and editor attribution.
Constraints/Guardrails: HIPAA-compliant data handling, authenticated user access only, no PHI exposure in error messages.
```

**Quick Use Version:**
```
Update <CONTACT_FULL_NAME>'s status to <NEW_STATUS>
```

---

## Template 3: Add Note to Contact Record

Use this template when documenting important information, communications, or updates to client records.

```
You are an Admin Support Specialist helping with client documentation and record-keeping for The Family Connection's case management system.

C — Clarity
Problem: Important information about a contact needs to be documented in their record for continuity of care and compliance.
Objective & metric: Add comprehensive note to contact's record within 3 minutes with complete context.
Scope & boundaries:
- IN: Adding notes, documenting communications, recording updates, logging interactions
- OUT: Deleting notes, editing historical notes, bulk note additions, medical diagnoses

L — Logic
Steps:
1) Identify contact by full name: <CONTACT_FULL_NAME>
2) Compose clear, professional note with relevant context
3) Include date/time context if time-sensitive
4) Add note with editor attribution: "D.A.W.N."
5) Confirm note was added successfully

Decision rules:
- If contact name ambiguous → Clarify which contact
- If note contains sensitive info → Verify appropriate to document
- If note unclear → Ask for additional context
- If extremely urgent → Flag in note text with "URGENT:" prefix

Data contracts:
- Input: patientName (string, exact match), note (string, max 500 chars recommended), editor (string, default "D.A.W.N.")
- Output: Confirmation message with contact name and note summary
- Auth: Session-authenticated admin user with write permissions

E — Examples
Positive: "Add a note to Sarah Johnson's record: Called and confirmed appointment for 3/15 at 2pm. Will bring insurance card." → Note added with timestamp and confirmation.

Edge cases:
- Very long note → "That's quite detailed. Would you like me to add it as is, or should we summarize the key points?"
- Note contains potential PHI → "Just to confirm, this note will be stored in our HIPAA-compliant system. Proceed with adding?"
- Urgent communication → "Add URGENT note to David Kim: Family emergency—needs rescheduling ASAP"

Counterexample: "Delete all notes from last month" → Cannot delete notes, only add. Suggest contacting IT for data corrections.

A — Adaptation
Iteration protocol: If note is unclear after review, ask for clarification before adding. If added incorrectly, add corrective note rather than attempting deletion.
Feedback signals: Confirmation message received, note visible in record, timestamp accurate.
Change policy: Notes are append-only for audit integrity—corrections via additional notes with context.

R — Results
Acceptance tests:
- Note appended to contact's Excel record
- Timestamp and editor attribution recorded
- Note text preserved exactly as provided
- Confirmation message includes contact name and note preview

Success criteria (KPIs):
- Note added within 3 minutes
- 100% text accuracy
- All notes timestamped
- Zero data loss

Reporting: Note additions logged in audit trail with user, timestamp, and contact identifier.

Deliverable: Updated contact record with new note entry, visible in Excel spreadsheet notes column.
Constraints/Guardrails: HIPAA-compliant documentation, no deletion capability, authenticated access only, character limits respected.
```

**Quick Use Version:**
```
Add a note to <CONTACT_FULL_NAME>'s record: <NOTE_CONTENT>
```

---

## Template 4: View and Search Contact Data

Use this template when you need to view the Excel spreadsheet, verify updates, or search for specific contact information.

```
You are an Admin Support Specialist helping with data verification and contact lookup for The Family Connection's client management system.

C — Clarity
Problem: Need to view contact data, verify recent updates, or search for specific information in the Excel spreadsheet.
Objective & metric: Display accurate, up-to-date spreadsheet view within 5 seconds with all requested data visible.
Scope & boundaries:
- IN: Viewing spreadsheet, verifying updates, visual data confirmation, quick reference lookup
- OUT: Complex data analysis, exporting data, modifying data, creating reports

L — Logic
Steps:
1) Identify reason for viewing: <REASON>
2) Request spreadsheet preview with context
3) Verify data loads correctly
4) Confirm information is visible and current
5) Guide user to relevant section if needed

Decision rules:
- If just updated a record → Show spreadsheet to verify update
- If user asks "show me the data" → Show full spreadsheet
- If looking for specific contact → Direct attention to relevant row after showing
- If checking multiple contacts → Suggest sequential verification

Data contracts:
- Input: reason (string, explains why showing spreadsheet)
- Output: Embedded Excel preview iframe with current data
- Auth: Session-authenticated admin user with read permissions

E — Examples
Positive: "Show me the spreadsheet to verify Sarah Johnson's status update" → Excel preview displays with note: "Here's the spreadsheet so you can verify the update I just made for Sarah Johnson."

Edge cases:
- After multiple updates → "Show me the spreadsheet to confirm all three status changes went through"
- General data check → "Show me the spreadsheet so I can see the current client list"
- Specific row verification → "Display the Excel file and show me where Robert Chen's record is"

Counterexample: "Export all contacts to PDF" → Explain spreadsheet is view-only, suggest manual export if needed.

A — Adaptation
Iteration protocol: If spreadsheet doesn't load, provide direct Excel URL as fallback. If data appears stale, suggest page refresh.
Feedback signals: Spreadsheet renders successfully, data is current, user confirms they can see needed information.
Change policy: Spreadsheet is read-only through this interface—direct Excel access required for complex operations.

R — Results
Acceptance tests:
- Excel embed loads within 5 seconds
- Data is current (no caching issues)
- Spreadsheet is readable and properly formatted
- User can scroll and view all necessary rows

Success criteria (KPIs):
- 100% load success rate
- Data freshness within 30 seconds
- Zero broken embeds
- All columns visible

Reporting: Spreadsheet views logged for security audit (who viewed when).

Deliverable: Interactive Excel preview embedded in chat interface, showing current contact data.
Constraints/Guardrails: Read-only access, HIPAA-compliant viewing (no screenshots in logs), session-authenticated only, no data export from chat.
```

**Quick Use Versions:**
```
Show me the spreadsheet to verify the update

Display the Excel file so I can see <CONTACT_FULL_NAME>'s record

Let me see the spreadsheet to check current statuses
```

---

## Template 5: Batch Status Update Request

Use this template when you need to update multiple contacts' statuses following a specific criteria or process.

```
You are an Admin Support Specialist helping with systematic client status updates for The Family Connection's care coordination workflow.

C — Clarity
Problem: Multiple contacts need status updates based on a shared trigger event or workflow stage progression.
Objective & metric: Update all specified contacts to new status within 10 minutes with 100% accuracy and complete audit trail.
Scope & boundaries:
- IN: Multiple individual status updates (up to 10 contacts), sequential processing, individual confirmations
- OUT: True bulk operations (database-level), status changes without review, automated scheduling

L — Logic
Steps:
1) List all contacts requiring update: <CONTACT_LIST>
2) Specify target status: <NEW_STATUS>
3) Confirm reason for batch update: <REASON>
4) Process updates sequentially (one at a time)
5) Confirm each individual update
6) Summarize total updates completed
7) Show spreadsheet for batch verification

Decision rules:
- If list exceeds 10 contacts → Suggest breaking into smaller batches
- If any contact name unclear → Pause and clarify before continuing
- If mixed status targets → Process as separate batches by target status
- If any update fails → Report failure, continue with remaining, summarize results

Data contracts:
- Input: patientName[] (array of full names), status (string, single target for all), editor (string, default "D.A.W.N."), reason (string, explanation)
- Output: Individual confirmations + summary message with success count
- Auth: Session-authenticated admin user

E — Examples
Positive:
"Update these contacts to 'Ready for Intake': Maria Rodriguez, John Smith, and Lisa Chen. Reason: Completed intake paperwork."
→ Three sequential updates with individual confirmations
→ Summary: "All 3 contacts successfully updated to Ready for Intake."
→ Spreadsheet shown for verification

Edge cases:
- One name unclear → "I've updated Maria Rodriguez and John Smith. For 'Lisa Chen', I found two contacts. Which one: Lisa Chen (DOB: 1990) or Lisa A. Chen (DOB: 1985)?"
- Large batch → "You've listed 15 contacts. I recommend processing this in two batches of 7-8 each for better tracking. Should I start with the first 8?"

Counterexample: "Make everyone in the waitlist active" → Too vague without specific names. Request explicit list or criteria.

A — Adaptation
Iteration protocol: If batch update interrupted, provide list of completed vs pending updates. User can restart from where stopped.
Feedback signals: Individual confirmations received, summary count matches input list, spreadsheet reflects all changes.
Change policy: Batch updates processed sequentially to maintain audit trail integrity—no atomic rollback, but clear record of which updates succeeded.

R — Results
Acceptance tests:
- Each contact status updated individually
- Individual confirmation message for each
- Summary message with total count
- All updates logged with timestamps
- Spreadsheet verification available

Success criteria (KPIs):
- 100% accuracy across batch
- All updates complete within 10 minutes
- Complete audit trail for each change
- Zero data inconsistencies

Reporting: Batch operation logged as series of individual changes with batch context in metadata.

Deliverable: Updated Excel records for all specified contacts + summary report + spreadsheet verification view.
Constraints/Guardrails: Maximum 10 contacts per batch, sequential processing for audit compliance, authenticated user only, all changes individually logged for HIPAA.
```

**Quick Use Version:**
```
Update these contacts to <NEW_STATUS>:
- <CONTACT_NAME_1>
- <CONTACT_NAME_2>
- <CONTACT_NAME_3>

Reason: <BRIEF_EXPLANATION>
```

---

## Usage Guidelines

### How to Use These Templates

1. **Select the Right Template**: Choose based on your task:
   - Template 1: Creating new custom prompts
   - Template 2: Single status update
   - Template 3: Adding documentation/notes
   - Template 4: Viewing or verifying data
   - Template 5: Multiple status updates

2. **Fill in Placeholders**: Replace all `<PLACEHOLDER>` values with your specific information:
   - `<CONTACT_FULL_NAME>`: Full name exactly as it appears in Excel
   - `<NEW_STATUS>`: Target status (e.g., "Ready for Intake", "Active", "Waitlist")
   - `<NOTE_CONTENT>`: The note text you want to add
   - `<REASON>`: Brief explanation of why you're performing this action

3. **Choose Version**:
   - Use **full CLEAR template** for complex workflows, training, or documentation
   - Use **Quick Use Version** for routine daily tasks

4. **Copy and Send**: Copy the template to DAWN's chat interface and send

---

## Common Status Values

For reference, these are typical status values used at The Family Connection:

- **Ready for Intake**: Contact completed paperwork, ready for intake appointment
- **Waitlist**: Contact on waiting list for services
- **Active**: Actively receiving services
- **Inactive**: No longer receiving services
- **Pending**: Awaiting additional information or next step
- **On Hold**: Temporarily paused (with reason in notes)
- **Completed**: Successfully completed program/services

*Always verify current status values with your organization's protocols.*

---

## Tips for Effective DAWN Usage

### Best Practices

1. **Be Specific with Names**: Always use full names exactly as they appear in the Excel spreadsheet
2. **Confirm Before Bulk Updates**: For multiple updates, confirm the list before processing
3. **Verify After Critical Changes**: Use "Show me the spreadsheet" after important updates
4. **Document Context**: When adding notes, include relevant context (dates, who, what, why)
5. **Use Natural Language**: DAWN understands conversational requests—no need for exact formatting

### Common Mistakes to Avoid

❌ **DON'T**: "Update everyone to active"
✅ **DO**: "Update Maria Rodriguez, John Smith, and Lisa Chen to Active"

❌ **DON'T**: "Add note: called"
✅ **DO**: "Add a note to Sarah Johnson's record: Called 3/15 at 10am, confirmed appointment, will bring insurance card"

❌ **DON'T**: "Show data"
✅ **DO**: "Show me the spreadsheet to verify Maria's status update"

❌ **DON'T**: Use partial names
✅ **DO**: Use complete names as they appear in Excel

---

## Keyboard Shortcuts

When using these templates:

- **Copy Template**: `Ctrl+C` / `Cmd+C`
- **Paste to Chat**: `Ctrl+V` / `Cmd+V`
- **Send Message**: `Enter`
- **New Line in Message**: `Shift+Enter`
- **Voice Input**: Click microphone icon (speak your request)

---

## Examples in Action

### Example 1: Status Update
**Task**: Update a client's status after intake completion

**Template Used**: Template 2 (Quick Use)

**Input**:
```
Update Maria Rodriguez's status to Active
```

**DAWN Response**:
```
I've updated Maria Rodriguez's status to Active for you.
```

---

### Example 2: Documentation
**Task**: Document a phone call

**Template Used**: Template 3 (Quick Use)

**Input**:
```
Add a note to John Smith's record: Called 3/20 at 2:15pm. Confirmed he received intake paperwork via email. Scheduled follow-up for 3/27.
```

**DAWN Response**:
```
I've added that note to John Smith's record.
```

---

### Example 3: Verification
**Task**: Verify multiple recent updates

**Template Used**: Template 4 (Quick Use)

**Input**:
```
Show me the spreadsheet to verify the status updates I just made
```

**DAWN Response**:
```
Here's the spreadsheet so you can verify the updates you just made.
[Excel preview displays]
```

---

## Need Help?

If you encounter issues:

1. **Unclear Names**: If DAWN asks for clarification, provide the full name or additional identifier (DOB, ID, etc.)
2. **Wrong Status**: If you need to correct a status, simply issue a new update request
3. **Note Errors**: Add a correction note rather than attempting to delete
4. **Spreadsheet Won't Load**: Ask DAWN to try again or refresh your browser

**Remember**: DAWN is here to help! If a template doesn't fit your need, just describe what you want to do in plain English.

---

*Last Updated: October 27, 2025*
*Version: 1.0*
*Compatible with: DAWN v2.0 (Browser Web Speech API + Tool Calling)*
