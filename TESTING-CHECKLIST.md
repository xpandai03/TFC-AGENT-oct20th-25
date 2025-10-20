# DAWN Agent Testing Checklist
**Date:** October 20, 2025
**Testing URL:** http://localhost:3002

---

## Pre-Test Setup ✅

- [ ] Browser open to http://localhost:3002
- [ ] Browser console open (F12 or Cmd+Option+I) - switch to "Console" tab
- [ ] Terminal visible where `npm run dev` is running
- [ ] Ready to take screenshots if needed

---

## 🧪 Test Suite 1: Basic Conversation (No Tools)

### Test 1.1: Initial Greeting
**Send:** `Hi DAWN, who are you?`

**Expected Results:**
- ✅ Response streams in character-by-character
- ✅ DAWN introduces herself warmly
- ✅ Mentions The Family Connection
- ✅ NO tools are called
- ✅ Browser console shows: `📚 Conversation history length: 0 messages`
- ✅ Terminal shows: `💬 DAWN received message: Hi DAWN, who are you?`

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

### Test 1.2: Conversation Memory
**Send:** `My name is Sarah`
**Then send:** `What's my name?`

**Expected Results:**
- ✅ DAWN remembers and says "Your name is Sarah"
- ✅ Browser console shows conversation history increasing
- ✅ NO tools are called
- ✅ Streaming works for both messages

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

### Test 1.3: General Question
**Send:** `What can you help me with?`

**Expected Results:**
- ✅ DAWN explains her capabilities
- ✅ Mentions updating statuses and adding notes
- ✅ Warm, professional tone
- ✅ NO tools are called

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

## 🔧 Test Suite 2: Tool Calling - Update Status

### Test 2.1: Simple Status Update
**Send:** `Update Reyna Vargas's status to Ready for Intake`

**Expected Results:**
- ✅ Terminal shows: `🔧 Tool: writeStatusToContact called with:`
- ✅ Terminal shows the parameters: `{ patientName: "Reyna Vargas", status: "Ready for Intake", editor: "D.A.W.N." }`
- ✅ Terminal shows: `✅ n8n response:` (with response from n8n)
- ✅ DAWN confirms the action: "I've updated Reyna's status to Ready for Intake"
- ✅ Response is professional and warm
- ✅ Check n8n: Webhook was triggered
- ✅ Check Excel: Status was actually updated

**Status:** ⬜ Pass / ⬜ Fail
**n8n Triggered:** ⬜ Yes / ⬜ No
**Excel Updated:** ⬜ Yes / ⬜ No
**Notes:**

---

### Test 2.2: Status Update with Different Status
**Send:** `Change John Smith's status to Waitlist`

**Expected Results:**
- ✅ Tool called: `writeStatusToContact`
- ✅ Parameters: `{ patientName: "John Smith", status: "Waitlist", editor: "D.A.W.N." }`
- ✅ n8n webhook triggered
- ✅ Confirmation message received
- ✅ Excel updated

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

### Test 2.3: Status Update with Variation in Phrasing
**Send:** `Set Maria Garcia to Active`

**Expected Results:**
- ✅ DAWN understands the intent
- ✅ Tool called correctly
- ✅ Status = "Active"
- ✅ n8n triggered

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

## 📝 Test Suite 3: Tool Calling - Add Notes

### Test 3.1: Simple Note Addition
**Send:** `Add a note for Reyna Vargas saying "Client confirmed appointment for Tuesday"`

**Expected Results:**
- ✅ Terminal shows: `🔧 Tool: addNoteToContact called with:`
- ✅ Parameters: `{ patientName: "Reyna Vargas", note: "Client confirmed appointment for Tuesday", editor: "D.A.W.N." }`
- ✅ Terminal shows: `✅ n8n response:`
- ✅ DAWN confirms note was added
- ✅ Check n8n: Webhook triggered
- ✅ Check Excel: Note was added

**Status:** ⬜ Pass / ⬜ Fail
**n8n Triggered:** ⬜ Yes / ⬜ No
**Excel Updated:** ⬜ Yes / ⬜ No
**Notes:**

---

### Test 3.2: Note with Different Phrasing
**Send:** `Add a note to John Smith's record: Called and left voicemail`

**Expected Results:**
- ✅ Tool called: `addNoteToContact`
- ✅ Correct patient name and note content
- ✅ n8n triggered
- ✅ Excel updated

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

### Test 3.3: Longer Note
**Send:** `Add a note for Maria Garcia: Client expressed interest in group therapy. Discussed available times. Prefers evenings. Follow up next week.`

**Expected Results:**
- ✅ Full note content captured
- ✅ Tool executed successfully
- ✅ Long note handled correctly

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

## 🧩 Test Suite 4: Ambiguity Handling

### Test 4.1: Missing Patient Name
**Send:** `Update status to Active`

**Expected Results:**
- ✅ DAWN asks for clarification: "Who would you like me to update?"
- ✅ NO tool called yet
- ✅ Polite, professional tone

**Then send:** `John Smith`

**Expected Results:**
- ✅ NOW tool is called
- ✅ Status updated correctly

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

### Test 4.2: Unclear Status
**Send:** `Update Reyna Vargas to new status`

**Expected Results:**
- ✅ DAWN asks what status to set
- ✅ NO tool called yet

**Then send:** `Ready for Intake`

**Expected Results:**
- ✅ Tool called with correct status

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

## 💬 Test Suite 5: Mixed Conversation with Tools

### Test 5.1: Tool Call Then Question
**Send:** `Update Reyna Vargas to Waitlist`
**Wait for response**
**Then send:** `What did you just do?`

**Expected Results:**
- ✅ First message: Tool called, status updated
- ✅ Second message: DAWN explains she updated the status (NO new tool call)
- ✅ Conversation memory working

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

### Test 5.2: Multiple Tools in Conversation
**Send:** `Update John Smith to Active`
**Wait for response**
**Then send:** `Now add a note saying he completed intake paperwork`

**Expected Results:**
- ✅ First tool: writeStatusToContact called
- ✅ Second tool: addNoteToContact called
- ✅ Both execute successfully
- ✅ Both reference John Smith correctly

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

## 🔀 Test Suite 6: Thread Management

### Test 6.1: Separate Conversations
1. **Start New Chat** (click "New Chat" button)
2. **Send:** `Update Reyna Vargas to Active`
3. **Start Another New Chat**
4. **Send:** `What did I just do?`

**Expected Results:**
- ✅ Thread 1: Shows Reyna update
- ✅ Thread 2: DAWN doesn't know (fresh context)
- ✅ Left sidebar shows both conversations with different titles
- ✅ Switching between threads maintains separate histories

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

### Test 6.2: Thread Titles
1. **Start New Chat**
2. **Send:** `Update client status for testing`

**Expected Results:**
- ✅ Left sidebar shows conversation titled "Update client status for testing..."
- ✅ Not just "New Chat"

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

## ⚠️ Test Suite 7: Error Handling

### Test 7.1: n8n Webhook Offline (if possible)
**Setup:** Stop n8n or use invalid webhook URL temporarily
**Send:** `Update Reyna Vargas to Active`

**Expected Results:**
- ✅ DAWN attempts tool call
- ✅ Graceful error message displayed
- ✅ User-friendly response (not raw error)
- ✅ Terminal shows error logged

**Status:** ⬜ Pass / ⬜ Fail / ⬜ N/A
**Notes:**

---

### Test 7.2: Extremely Long Input
**Send:** A very long message with status update (500+ characters)

**Expected Results:**
- ✅ DAWN handles gracefully
- ✅ Extracts patient name and status correctly
- ✅ Tool called successfully

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

## 🎨 Test Suite 8: UI/UX

### Test 8.1: Streaming Visibility
**Send:** `Tell me a story about a friendly robot helping with client records`

**Expected Results:**
- ✅ Text appears progressively (not all at once)
- ✅ Visible character-by-character streaming
- ✅ Smooth user experience

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

### Test 8.2: Loading States
**Send:** `Update Reyna Vargas to Active`

**Expected Results:**
- ✅ Thinking/loading indicator shows briefly
- ✅ Clear when DAWN is processing
- ✅ Indicator disappears when done

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

### Test 8.3: Mobile View (if applicable)
**Action:** Resize browser to mobile width

**Expected Results:**
- ✅ Interface remains usable
- ✅ Sidebar accessible via menu
- ✅ Messages display correctly

**Status:** ⬜ Pass / ⬜ Fail / ⬜ N/A
**Notes:**

---

## 📊 Test Suite 9: Console & Logging

### Test 9.1: Browser Console
**Send:** `Update Reyna Vargas to Active`
**Check Browser Console**

**Expected Results:**
- ✅ `💬 Sending message to DAWN: Update Reyna Vargas to Active`
- ✅ `📚 Conversation history length: X messages`
- ✅ `📝 Received chunk:` (multiple times)
- ✅ `✅ Stream complete`
- ✅ No errors in console

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

### Test 9.2: Server Logs (Terminal)
**Check Terminal where npm run dev is running**

**Expected Results:**
- ✅ `💬 DAWN received message:`
- ✅ `📚 Conversation history:`
- ✅ `🔧 Tool: writeStatusToContact called with:`
- ✅ `✅ n8n response:`
- ✅ No errors

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

## 🔄 Test Suite 10: Edge Cases

### Test 10.1: Empty Message
**Send:** (just whitespace or empty)

**Expected Results:**
- ✅ Message not sent
- ✅ No error shown
- ✅ Composer validates input

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

### Test 10.2: Special Characters in Names
**Send:** `Update María José O'Connor's status to Active`

**Expected Results:**
- ✅ Special characters handled correctly
- ✅ Name preserved exactly
- ✅ Tool called successfully

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

### Test 10.3: Case Sensitivity
**Send:** `update reyna vargas to active` (all lowercase)

**Expected Results:**
- ✅ DAWN understands intent
- ✅ Tool called
- ✅ Name used as provided (lowercase)

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

## 🚀 Final Integration Tests

### Test 11.1: Complete Workflow
1. Start new chat
2. Greet DAWN
3. Update a client status
4. Add a note to same client
5. Ask DAWN what you did
6. Start another chat
7. Verify first chat history preserved

**Expected Results:**
- ✅ All steps work smoothly
- ✅ Tools execute correctly
- ✅ Memory works
- ✅ Threads are independent

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

### Test 11.2: Rapid Fire Messages
**Send multiple messages quickly:**
1. `Update Reyna to Active`
2. `Update John to Waitlist`
3. `Add note for Maria: Completed intake`

**Expected Results:**
- ✅ All tools execute
- ✅ No conflicts or race conditions
- ✅ All responses stream correctly
- ✅ All n8n webhooks triggered

**Status:** ⬜ Pass / ⬜ Fail
**Notes:**

---

## 📋 Summary

**Total Tests:** 32
**Tests Passed:** ___ / 32
**Tests Failed:** ___ / 32
**Critical Issues Found:** ___

**Overall Status:** ⬜ Ready for Production / ⬜ Needs Work

---

## 🐛 Issues Found

### Issue 1
**Severity:** ⬜ Critical / ⬜ High / ⬜ Medium / ⬜ Low
**Description:**
**Steps to Reproduce:**
**Expected:**
**Actual:**

### Issue 2
**Severity:** ⬜ Critical / ⬜ High / ⬜ Medium / ⬜ Low
**Description:**
**Steps to Reproduce:**
**Expected:**
**Actual:**

---

## ✅ Next Steps

After completing this checklist:
1. [ ] Review all failures
2. [ ] Document any bugs found
3. [ ] Verify n8n webhooks are working
4. [ ] Check Excel for actual data updates
5. [ ] Get stakeholder approval
6. [ ] Plan production deployment

---

**Tested By:** _______________
**Date:** _______________
**Build Version:** Phase 1-3 Complete
