# Vision AI Chat - Testing Guide

## 🧪 How to Test the New Chat Interface

After deployment completes, follow these steps to verify everything works correctly.

---

## 1️⃣ Access the Chat Page

**URL:** https://ai.visionedu.online/chat

**Expected Behavior:**
- If not logged in → Redirects to `/login`
- If logged in → Shows new chat interface

---

## 2️⃣ Test Authentication Flow

### Login Test
1. Go to https://ai.visionedu.online/login
2. Click "Continue with Google"
3. Sign in with Google account
4. Should redirect to `/chat` automatically

### Session Persistence
1. After logging in, refresh the page
2. Should stay logged in (not redirect to login)
3. User profile should show in sidebar

---

## 3️⃣ Test Sidebar Features

### Logo & Branding
- [ ] Vision AI logo displays correctly
- [ ] Logo has gradient background
- [ ] Logo text shows "Vision AI" with gradient on "AI"

### New Chat Button
- [ ] Click "New Chat" button
- [ ] Messages clear
- [ ] Empty state appears
- [ ] Subject resets to "All Subjects"

### Chat History (Future Feature)
- [ ] "Today" section visible
- [ ] "Previous 7 Days" section visible
- [ ] Currently empty (history not implemented yet)

### User Profile
- [ ] User avatar shows (image or initials)
- [ ] User name displays correctly
- [ ] User email displays correctly
- [ ] Click profile → Dropdown menu appears

### User Menu
- [ ] "Home" link → Goes to `/` (homepage)
- [ ] "Dashboard" link → Opens `visionedu.online/dashboard` in new tab
- [ ] "Logout" link → Clears session and redirects to `/login`

### Sidebar Toggle
- [ ] Click toggle button → Sidebar collapses (desktop)
- [ ] Click again → Sidebar expands

---

## 4️⃣ Test Top Bar Features

### Mobile Menu (Mobile Only)
- [ ] On mobile, hamburger menu appears
- [ ] Click menu → Sidebar slides in from left
- [ ] Click outside → Sidebar closes

### Subject Selector
- [ ] "All Subjects" button active by default
- [ ] Click "Mathematics" → Button becomes active (gradient)
- [ ] Click "English" → Button becomes active
- [ ] Click "Science" → Button becomes active
- [ ] Click "Social Studies" → Button becomes active
- [ ] Only one subject active at a time

### Clear Chat Button
- [ ] Click trash icon
- [ ] Confirmation dialog appears
- [ ] Click "OK" → Messages clear
- [ ] Click "Cancel" → Messages remain

### Status Indicator
- [ ] Green dot visible
- [ ] Dot pulses (animation)
- [ ] Text says "Online"

---

## 5️⃣ Test Empty State

### Welcome Message
- [ ] "Welcome to Vision AI" title visible
- [ ] Subtitle: "Your intelligent WASSCE study companion"
- [ ] Large sparkle icon visible

### Quick Action Cards
Test each card by clicking:

1. **Quadratic Formula Card**
   - [ ] Click card
   - [ ] Input fills with "What is the quadratic formula?"
   - [ ] Message sends automatically

2. **Solve Equations Card**
   - [ ] Click card
   - [ ] Input fills with "Solve: 3x + 9 = 24"
   - [ ] Message sends automatically

3. **Photosynthesis Card**
   - [ ] Click card
   - [ ] Input fills with "Explain photosynthesis"
   - [ ] Message sends automatically

4. **Ghana History Card**
   - [ ] Click card
   - [ ] Input fills with "When did Ghana gain independence?"
   - [ ] Message sends automatically

### Capabilities List
- [ ] "Step-by-step solutions" visible with checkmark
- [ ] "WASSCE curriculum coverage" visible with checkmark
- [ ] "Instant responses" visible with checkmark
- [ ] "Free unlimited queries" visible with checkmark

---

## 6️⃣ Test Messaging Features

### Send a Message
1. Type "Hello" in input box
2. Press Enter (or click send button)

**Expected Behavior:**
- [ ] Empty state disappears
- [ ] User message appears with your avatar/initials
- [ ] Message shows "You" as author
- [ ] Timestamp appears (e.g., "2:30 PM")
- [ ] Typing indicator appears (3 animated dots)
- [ ] AI response appears after ~1-2 seconds
- [ ] AI message shows "Vision AI" as author
- [ ] Source badge appears (e.g., "📚 Knowledge Base")

### Test Math Question
Type: "Solve: 2x + 5 = 15"

**Expected Behavior:**
- [ ] AI responds with step-by-step solution
- [ ] Source badge shows "🔢 Math Engine"
- [ ] Solution includes:
  - Subtract 5 from both sides
  - Divide by 2
  - Final answer: x = 5

### Test Knowledge Question
Type: "What is photosynthesis?"

**Expected Behavior:**
- [ ] AI responds with explanation
- [ ] Source badge shows "📚 Knowledge Base"
- [ ] Response includes definition and process

### Test Subject Filtering
1. Select "Mathematics" subject
2. Type "quadratic formula"
3. Send message

**Expected Behavior:**
- [ ] Query sent with `[mathematics]` prefix
- [ ] AI responds with math-focused answer

---

## 7️⃣ Test Input Features

### Auto-resize Textarea
1. Type multiple lines of text
2. Press Shift+Enter to add new lines

**Expected Behavior:**
- [ ] Textarea expands as you type
- [ ] Maximum height: 200px
- [ ] Scrollbar appears if exceeds max height

### Character Counter
1. Type text in input
2. Watch character count

**Expected Behavior:**
- [ ] Counter shows "X / 2000"
- [ ] Updates in real-time
- [ ] Turns red if exceeds 2000 characters

### Keyboard Shortcuts
- [ ] Enter → Sends message
- [ ] Shift+Enter → New line (doesn't send)

### Send Button
- [ ] Hover → Button scales up slightly
- [ ] Click → Sends message
- [ ] Disabled while loading (can't spam)

### Attach File Button
- [ ] Click paperclip icon
- [ ] Alert shows "File attachment feature coming soon!"

---

## 8️⃣ Test Message Formatting

### Markdown Support
Type these messages to test formatting:

1. **Bold Text:** `This is **bold** text`
   - [ ] "bold" appears in bold

2. **Italic Text:** `This is *italic* text`
   - [ ] "italic" appears in italics

3. **Code:** `Use the \`print()\` function`
   - [ ] "print()" appears in code style

4. **Link:** `Visit [Google](https://google.com)`
   - [ ] "Google" appears as clickable link
   - [ ] Opens in new tab

---

## 9️⃣ Test Mobile Responsive Design

### Resize Browser Window
1. Make window narrow (< 768px)

**Expected Changes:**
- [ ] Sidebar becomes overlay (hidden by default)
- [ ] Mobile menu button appears in top bar
- [ ] Subject names hidden (icons only)
- [ ] Status text hidden (dot only)
- [ ] Quick action cards stack vertically

### Mobile Sidebar
- [ ] Click hamburger menu → Sidebar slides in
- [ ] Click outside sidebar → Sidebar closes
- [ ] Sidebar covers full height

---

## 🔟 Test Error Handling

### Network Error
1. Disconnect internet
2. Send a message

**Expected Behavior:**
- [ ] Error message appears
- [ ] Message: "Could not reach Vision AI server..."
- [ ] Red error icon visible

### Empty Message
1. Click send button without typing

**Expected Behavior:**
- [ ] Nothing happens (message not sent)
- [ ] Input remains focused

### Long Message (> 2000 chars)
1. Type or paste > 2000 characters
2. Try to send

**Expected Behavior:**
- [ ] Alert appears: "Message is too long..."
- [ ] Message not sent
- [ ] Character counter shows red

---

## 1️⃣1️⃣ Test Logout Flow

1. Click user profile in sidebar
2. Click "Logout" in dropdown menu

**Expected Behavior:**
- [ ] Session cleared from storage
- [ ] Redirects to `/login`
- [ ] Can't access `/chat` without logging in again

---

## 🐛 Common Issues & Solutions

### Issue: Page shows "Deployment not found"
**Solution:** Wait 2-3 minutes for Vercel deployment to complete

### Issue: Redirects to login.html (404)
**Solution:** Clear browser cache, should redirect to `/login` (no .html)

### Issue: Google Sign-In doesn't work
**Solution:** Check Google OAuth configuration:
- Authorized JavaScript Origins: `https://ai.visionedu.online`
- Authorized Redirect URIs: `https://ai.visionedu.online/login`

### Issue: Messages not sending
**Solution:** 
1. Check browser console for errors
2. Verify `/api/chat` endpoint is working
3. Check network tab for failed requests

### Issue: Styles not loading
**Solution:**
1. Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Check `chat-styles.css` is loading in Network tab

### Issue: User profile not showing
**Solution:**
1. Check session exists in browser storage
2. Verify session format is correct JSON
3. Try logging out and logging in again

---

## ✅ Final Checklist

After testing all features above:

- [ ] All sidebar features work
- [ ] All top bar features work
- [ ] Empty state displays correctly
- [ ] Quick actions work
- [ ] Messages send and receive
- [ ] Typing indicator appears
- [ ] Source badges display
- [ ] Input features work (auto-resize, counter)
- [ ] Markdown formatting works
- [ ] Mobile responsive design works
- [ ] Error handling works
- [ ] Logout works

---

## 📊 Performance Checks

### Load Time
- [ ] Page loads in < 2 seconds
- [ ] No console errors
- [ ] All assets load successfully

### Response Time
- [ ] AI responds in < 3 seconds
- [ ] Typing indicator shows immediately
- [ ] Messages appear smoothly

### Animations
- [ ] All animations smooth (60fps)
- [ ] No janky scrolling
- [ ] Hover effects responsive

---

## 📝 Report Issues

If you find any issues during testing:

1. **Note the issue:** What went wrong?
2. **Steps to reproduce:** How to trigger the issue?
3. **Expected behavior:** What should happen?
4. **Actual behavior:** What actually happened?
5. **Browser/Device:** Chrome, Safari, Mobile, etc.
6. **Console errors:** Any errors in browser console?

---

**Happy Testing! 🚀**
