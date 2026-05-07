# Enterprise Dashboard - Quick Start Guide

## 🚀 Getting Started

Welcome to the Vision Education Enterprise Dashboard! This guide will help you get started with all the new features.

## 📋 Table of Contents

1. [Accessing the Dashboard](#accessing-the-dashboard)
2. [Grade Book System](#grade-book-system)
3. [Quiz Builder](#quiz-builder)
4. [Analytics Dashboard](#analytics-dashboard)
5. [User Management](#user-management)
6. [Data Export](#data-export)

---

## Accessing the Dashboard

### For Teachers
1. Go to `/enterprise-login.html`
2. Select "Teacher" role
3. Enter your credentials and institution code
4. You'll be redirected to the enterprise dashboard or grade book

### For Enterprise Admins
1. Go to `/enterprise-login.html`
2. Select "Enterprise Admin" role
3. Enter your credentials and institution code
4. Access the full enterprise dashboard

---

## Grade Book System

### Creating Your First Assignment

1. **Navigate to Grade Book**
   - From enterprise dashboard, click "Grade Book" in the left navigation menu
   - Or visit `/grade-book.html` directly (requires teacher/admin login)

2. **Select a Class**
   - Choose a class from the dropdown
   - If no classes exist, click "New Class" to create one

3. **Create an Assignment**
   - Click "New Assignment" button
   - Fill in the details:
     - **Name:** e.g., "Chapter 5 Quiz"
     - **Description:** Optional details
     - **Maximum Points:** e.g., 100
     - **Due Date:** Select from calendar
     - **Type:** Homework, Quiz, Test, Project, or Participation
     - **Category:** Optional (create categories first)
     - **Weight:** Percentage weight (e.g., 10%)
   - Click "Save"

### Entering Grades

1. **Go to Grade Entry Tab**
   - Click the "Grade Entry" tab
   - Select an assignment from the dropdown

2. **Enter Grades**
   - Type scores directly into the input fields
   - Use **Tab** or **Enter** to move to the next student
   - Scores are validated automatically (0 to max points)
   - Grades save automatically

3. **Set Grade Status**
   - Choose from: Submitted, Late, Missing, Excused
   - Excused assignments are excluded from calculations

4. **Add Comments**
   - Type comments in the comments field
   - Comments save automatically

### Using Categories

1. **Create Categories**
   - Go to "Categories" tab
   - Click "New Category"
   - Enter:
     - **Name:** e.g., "Tests"
     - **Weight:** e.g., 40%
     - **Description:** Optional
   - Click "Save"

2. **Assign to Assignments**
   - When creating/editing assignments
   - Select the category from dropdown
   - Grades will be calculated using category weights

### Viewing Reports

1. **Go to Reports Tab**
   - Click "Reports" tab
   - View:
     - Class overview statistics
     - Grade distribution
     - Student performance table
     - Assignment statistics

2. **Export Data**
   - Click "Export to Excel" button
   - CSV file downloads automatically
   - Includes all students, assignments, and grades

### Keyboard Shortcuts

- **Ctrl+Z:** Undo last grade change
- **Ctrl+Y:** Redo last undone change
- **Tab/Enter:** Navigate between grade inputs

---

## Quiz Builder

### Creating a Quiz

1. **Open Quiz Builder**
   - From enterprise dashboard, go to "Quizzes" section
   - Click "Open Quiz Builder"
   - Or visit `/quiz-builder.html` directly (requires teacher/admin login)

2. **Create New Quiz**
   - Click "Create Quiz" button
   - Fill in:
     - **Title:** e.g., "Chapter 5 Assessment"
     - **Description:** Optional
     - **Duration:** Time limit in minutes
     - **Subject:** Select from dropdown
   - Click "Save"

### Adding Questions

1. **Edit Quiz**
   - Click "Edit" button on a quiz card
   - Click "Add Question" button

2. **Create Question**
   - Enter question text
   - Select question type:
     - **Multiple Choice:** 2-4 options
     - **True/False:** Automatic options
     - **Short Answer:** Text response
   - Enter options (for multiple choice)
   - Set correct answer (index number, 0-based)
   - Set points value
   - Click "Save"

3. **Manage Questions**
   - Questions appear in the quiz editor
   - Click X to remove a question
   - Questions are saved automatically

### Publishing a Quiz

1. **Review Quiz**
   - Ensure all questions are added
   - Check duration and settings

2. **Publish**
   - Click "Publish" button on quiz card
   - Confirm publication
   - Quiz becomes available to students

### Quiz Management

- **Duplicate:** Create a copy of existing quiz
- **Delete:** Remove quiz permanently
- **Filter:** View by status (draft, published, archived)
- **Preview:** See how quiz appears to students (coming soon)
- **Results:** View student performance (coming soon)

---

## Analytics Dashboard

### Viewing Analytics

1. **Navigate to Analytics**
   - Click "Analytics" in the left navigation
   - Dashboard loads automatically

2. **Performance Overview**
   - **Average Performance:** Class-wide average
   - **Total Questions:** All questions answered
   - **Correct Answers:** Total correct responses
   - **Active Students:** Students with activity

3. **Performance Distribution**
   - Visual breakdown by performance level:
     - Excellent (90-100%)
     - Good (70-89%)
     - Average (50-69%)
     - Needs Improvement (<50%)

4. **Top Performers**
   - Top 5 students by performance
   - Shows percentage and activity

5. **Students Needing Support**
   - Students performing below 60%
   - Prioritize for intervention

### Using Analytics Data

- **Identify Trends:** Track class performance over time
- **Intervention:** Focus on at-risk students
- **Recognition:** Acknowledge top performers
- **Reporting:** Use data for parent/admin reports

---

## User Management

### Viewing User Profiles

1. **Navigate to Students/Teachers Section**
   - Click "Students" or "Teachers" in navigation

2. **View Profile**
   - Click "View" button on any user
   - See detailed profile with:
     - Basic information
     - Statistics
     - Performance data

### Editing Users

1. **Open Profile**
   - Click "View" on a user
   - Click "Edit Profile" button

2. **Update Information**
   - Change name
   - Update class (students) or subject (teachers)
   - Click "Save Changes"

### Resetting Passwords

1. **Open Profile**
   - Click "View" on a user
   - Click "Reset Password" button

2. **Set New Password**
   - Enter new password (min 6 characters)
   - Confirm
   - Share new credentials with user

### Deleting Users

1. **Open Profile**
   - Click "View" on a user
   - Click "Delete" button (red)

2. **Confirm Deletion**
   - Confirm the action
   - User is permanently removed

### Creating New Users

1. **Add Student**
   - Go to Students section
   - Click "Add Student" button
   - Enter: Name, Email, Password, Class
   - Credentials are displayed for sharing

2. **Add Teacher**
   - Go to Teachers section
   - Click "Add Teacher" button
   - Enter: Name, Email, Password, Subject
   - Credentials are displayed for sharing

---

## Data Export

### Exporting Grades

1. **From Grade Book**
   - Open grade book
   - Select a class
   - Go to "Reports" tab
   - Click "Export to Excel"
   - CSV file downloads with all data

### Exporting User Lists

1. **From Dashboard**
   - Go to Students or Teachers section
   - Click "Export" button
   - CSV file downloads with user data

### Export Format

**Grades CSV includes:**
- Student name and email
- All assignment scores
- Overall grade percentage
- Letter grade

**Users CSV includes:**
- Name and email
- Role and institution
- Class/subject
- Join date

---

## 💡 Tips & Best Practices

### Grade Book
- ✅ Create categories before assignments for better organization
- ✅ Use consistent naming for assignments
- ✅ Enter grades regularly to keep data current
- ✅ Use keyboard shortcuts for faster entry
- ✅ Export data regularly for backups

### Quiz Builder
- ✅ Start with draft status while building
- ✅ Add clear, unambiguous questions
- ✅ Test quizzes before publishing
- ✅ Set appropriate time limits
- ✅ Use varied question types

### Analytics
- ✅ Check analytics weekly
- ✅ Identify trends early
- ✅ Intervene with at-risk students promptly
- ✅ Celebrate top performers
- ✅ Use data for parent communications

### User Management
- ✅ Keep user information up to date
- ✅ Use strong passwords
- ✅ Document password resets
- ✅ Regular audit of user accounts
- ✅ Remove inactive users

---

## 🆘 Troubleshooting

### Grade Book Issues

**Problem:** Grades not saving
- **Solution:** Check internet connection, refresh page, try again

**Problem:** Can't see students
- **Solution:** Ensure class is selected, check institution linkage

**Problem:** Calculations seem wrong
- **Solution:** Verify category weights sum to 100%, check excused assignments

### Quiz Builder Issues

**Problem:** Can't publish quiz
- **Solution:** Ensure at least one question is added

**Problem:** Questions not appearing
- **Solution:** Refresh page, check if questions were saved

### Analytics Issues

**Problem:** No data showing
- **Solution:** Ensure students have activity, check data sync

**Problem:** Performance seems incorrect
- **Solution:** Verify student statistics, check calculation logic

### User Management Issues

**Problem:** Can't edit user
- **Solution:** Check permissions, ensure you're logged in as admin

**Problem:** Password reset not working
- **Solution:** Ensure password meets minimum requirements (6 characters)

---

## 📞 Support

For additional help:
- Check the full documentation: `ENTERPRISE_FEATURES_COMPLETE.md`
- Contact your system administrator
- Email: support@visionedu.online

---

## 🎓 Training Resources

### Video Tutorials (Coming Soon)
- Grade Book Basics
- Creating Effective Quizzes
- Understanding Analytics
- User Management Best Practices

### Documentation
- Full feature documentation available
- API documentation for developers
- Integration guides

---

**Last Updated:** May 7, 2026
**Version:** 1.0.0

Happy teaching! 🎉
