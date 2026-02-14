# Deploying Django to AWS Elastic Beanstalk

Follow these steps to deploy your application to AWS Elastic Beanstalk with HTTPS and a proper production environment.

## ⚠️ Critical Warnings

1.  **SQLite Data Loss**: You are currently using `db.sqlite3`. **Elastic Beanstalk instances are ephemeral.** This means every time you deploy, the instance is replaced, and **your database will be wiped**.
    *   **Recommendation**: Use **AWS RDS** (PostgreSQL) for a persistent production database.
2.  **Media Files**: Similarly, user-uploaded files in `media_volume` will be lost on redeployment. Use **AWS S3** for production media storage.

## Prerequisites

1.  **AWS Account** with permissions to create Elastic Beanstalk environments.
2.  **Domain Name** (e.g., `api.planner.princecodes.com`) pointed to AWS (Route53 recommended).
3.  **SSL Certificate**: Request a public certificate for your domain in **AWS Certificate Manager (ACM)**. *Ensure it is in the same region as your Elastic Beanstalk app.*

## Step 1: Initialize Elastic Beanstalk

1.  Open your terminal in the `server` directory.
2.  Initialize the EB application:
    ```bash
    eb init -p "Docker running on 64bit Amazon Linux 2023" eld-compliance-simulator
    ```
    *   Region: Select your preferred region (e.g., `us-east-1`).
    *   SSH: Yes, set up SSH so you can debug if needed.

## Step 2: Create the Environment

1.  Create the environment (this takes about 10-15 minutes):
    ```bash
    eb create eld-prod
    ```
2.  **Important**: Elastic Beanstalk detects `docker-compose.yml` by default. Since we created a specific `docker-compose.aws.yml`, we need to tell EB to use it.
    *   *Actually, EB looks for `docker-compose.yml`.*
    *   **Action**: Before deploying, rename/copy your file:
        ```bash
        cp docker-compose.aws.yml docker-compose.yml
        ```
        *(Make sure to `.gitignore` this if you want to keep the verify dev one, or just rename it specifically for the deploy step).*

## Step 3: Configure Environment Variables

1.  Go to the [Elastic Beanstalk Console](https://console.aws.amazon.com/elasticbeanstalk).
2.  Select your environment (`eld-prod`).
3.  Go to **Configuration** -> **Updates, monitoring, and logging**.
4.  Scroll down to **Environment properties**.
5.  Add the variables from your `.env` file:
    *   `DJANGO_SECRET_KEY`: (Your production secret)
    *   `DEBUG`: `False`
    *   `ALLOWED_HOSTS`: `.elasticbeanstalk.com,api.planner.princecodes.com`
    *   (Add any other variables your app needs)
6.  Click **Apply**.

## Step 4: Configure HTTPS (Auto SSL)

1.  In the Elastic Beanstalk Console, go to **Configuration** -> **Load balancer**.
2.  Click **Edit**.
3.  **Listeners**:
    *   Add a new listener.
    *   **Port**: `443`
    *   **Protocol**: `HTTPS`
    *   **SSL certificate**: Select the ACM certificate you created earlier.
    *   **Default process**: `default` (Port 80).
4.  **Rules** (Optional - Redirect HTTP to HTTPS):
    *   You may need to configure the Application Load Balancer directly in the EC2 console to add a redirect rule from port 80 to 443.
5.  Click **Apply**.

## Step 5: Deploy

1.  Commit your changes (including the new `docker-compose.yml` if you renamed it).
    ```bash
    git add .
    git commit -m "Prepare for AWS deployment"
    ```
2.  Deploy:
    ```bash
    eb deploy
    ```

## Troubleshooting

-   **502 Bad Gateway**: Usually means the Docker container crashed or valid HTTP response wasn't received.
    *   Check logs: `eb logs`
-   **Static Files Missing**: Ensure `python manage.py collectstatic` ran (it should run automatically if configured in entrypoint, or you might need to run it manually via `eb ssh`).
    *   *Note*: The current `docker-compose` mounts a volume. In production, it's better to have Nginx serve static files directly or use WhiteNoise/S3. The current setup shares a volume, which serves files *generated* by the container.
