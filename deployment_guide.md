# Deployment Guide: GitHub & Vercel

This guide explains how to upload your project to GitHub and deploy it to Vercel with a PostgreSQL database.

## Prerequisites
- GitHub Account
- Vercel Account (connected to GitHub)

## Step 1: Upload to GitHub

1.  **Initialize Git** (if not already done):
    Open your terminal in the project folder and run:
    ```bash
    git init
    git add .
    git commit -m "Initial commit for Vercel deployment"
    ```

2.  **Create a Repository on GitHub**:
    -   Go to [GitHub.com](https://github.com/new).
    -   Create a new repository (e.g., `reservation-site`).
    -   **Important**: Do NOT check "Initialize with README", .gitignore, or license. Create an empty repository.

3.  **Push Code**:
    Follow the instructions shown on GitHub to push your existing code:
    ```bash
    git remote add origin https://github.com/<YOUR-USERNAME>/reservation-site.git
    git branch -M main
    git push -u origin main
    ```

## Step 2: Deploy to Vercel

1.  **Import Project**:
    -   Go to [Vercel Dashboard](https://vercel.com/dashboard).
    -   Click **"Add New..."** -> **"Project"**.
    -   Find your `reservation-site` repository and click **"Import"**.

2.  **Configure Project**:
    -   Framework Preset: **Next.js** (Enable automatically).
    -   Root Directory: `./` (leave default).
    -   **Environment Variables**:
        -   Open the "Environment Variables" section.
        -   You will need to generate a `AUTH_SECRET`. You can run `npx auth secret` locally to generate one, or use any long random string.
        -   Add key: `AUTH_SECRET`, value: `<your-generated-secret>`.

3.  **Deploy**:
    -   Click **"Deploy"**.
    -   *Note: The first deployment might fail or show errors because the database isn't connected yet. This is expected.*

## Step 3: Connect Database & Configure Build

1.  **Connect Vercel Postgres**:
    -   In your Vercel project dashboard, go to the **"Storage"** tab.
    -   Click **"Connect Store"** -> **"Create New"** -> **"Postgres"**.
    -   Choose a region (e.g., Tokyo `hnd1` or US West) and create.
    -   **Wait** until it shows "Connected".

2.  **Configure Build Command (Critical for Database)**:
    -   Go to **"Settings"** -> **"General"**.
    -   Scroll to **"Build & Development Settings"**.
    -   Toggle **"Override"** for **Build Command**.
    -   Enter the following command:
        ```bash
        npx prisma migrate deploy && next build
        ```
    -   *This ensures the database tables are created automatically during deployment.*
    -   Click **"Save"**.

3.  **Redeploy**:
    -   Go to the **"Deployments"** tab.
    -   Click the three dots on the latest deployment -> **"Redeploy"**.
    -   Wait for the build to complete. It should now succeed and initialize the database.

## Step 4: Initialize Database (Migration)

Since this is a new database, it has no tables. You need to run the migration *against the production database*.

1.  **Vercel Toolbar**:
    -   You can verify the status in the Vercel logs.

2.  **Run Migration Locally (Recommended)**:
    To apply the schema to your Vercel DB from your local machine:
    
    a. **Pull Env Vars**:
    ```bash
    npm i -g vercel
    vercel link
    vercel env pull .env.development.local
    ```
    
    b. **Run Migration**:
    ```bash
    npx prisma migrate deploy
    ```
    *This command applies your `schema.prisma` to the remote Vercel database.*

3.  **Seed Data (Optional)**:
    If you want the admin user created initially:
    ```bash
    npx ts-node prisma/seed_test_data.ts
    ```
    *(Note: Ensure your seed script doesn't conflict with existing data if you run it multiple times)*

## Step 5: Local Development (Post-Migration)

To run `npm run dev` locally now, you must be connected to a Postgres database.
-   You can use the `.env.development.local` file pulled from Vercel to connect to the cloud DB (easiest).
-   Just run `npm run dev`, and it will use the remote Vercel DB.

> [!WARNING]
> Using the remote Vercel DB for local development means any data you delete/change locally affects the "production" data if you are using the same database instance. For a real production app, you typically have separate "Preview" and "Production" databases.
