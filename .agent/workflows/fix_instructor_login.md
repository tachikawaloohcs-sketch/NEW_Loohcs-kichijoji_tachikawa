---
description: Fix instructor login issues where instructors are incorrectly logged in as students
---
# Fix Instructor Login Roles

This workflow resolves the issue where legitimate instructors logging in via LINE are created as new "Student" accounts instead of being linked to their existing "Instructor" accounts.

This happens when the email address provided by LINE does not match the email registered in the system for the instructor.

## 1. Verify Database Connection
Ensure your `.env` file points to the correct production database (PostgreSQL).
If running locally against production data, ensure your `DATABASE_URL` is correct.

## 2. Run the Fix Script
Run the following command to find and merge duplicate accounts for "Nako Tozuka" and "hazuki".

```bash
npx tsx scripts/fix-instructor-roles.ts
```

## 3. Review Output
The script will output the users found and any merge actions taken.
- It looks for an Instructor account (without LINE ID).
- It looks for a Student account (with LINE ID) with a similar name.
- It moves the LINE ID to the Instructor account.
- It deletes the temporary Student account.

## Future Prevention
To prevent this, ensure instructors use the same email for LINE as they do for their registration, or manually link their LINE ID via the Admin panel immediately after registration.
