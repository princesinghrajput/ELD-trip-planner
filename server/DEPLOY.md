# Deployment Instructions for EC2

## Prerequisites
1.  **AWS EC2 Instance**: Launch an EC2 instance (Ubuntu 22.04 LTS recommended).
2.  **Security Group**: proper inbound rules for:
    -   SSH (22) - Your IP
    -   HTTP (80) - Anywhere
    -   HTTPS (443) - Anywhere (if adding SSL later)
3.  **Docker & Docker Compose**: Installed on the EC2 instance.

## Deployment Steps

1.  **SSH into your EC2 instance**:
    ```bash
    ssh -i your-key.pem ubuntu@your-ec2-ip
    ```

2.  **Clone the Repository**:
    ```bash
    git clone <your-repo-url>
    cd ELD-compliance-simulator/server
    ```

3.  **Set up Environment Variables**:
    Create a `.env` file with production values:
    ```bash
    nano .env
    ```
    Content example:
    ```env
    DJANGO_SECRET_KEY=your-semcret-key-prod
    DJANGO_DEBUG=False
    DJANGO_ALLOWED_HOSTS=your-ec2-ip,your-domain.com
    CORS_ALLOWED_ORIGINS=http://your-domain.com
    ```

4.  **Build and Run**:
    ```bash
    sudo docker compose -f docker-compose.prod.yml up -d --build
    ```

5.  **Run Migrations**:
    ```bash
    sudo docker compose -f docker-compose.prod.yml exec web python manage.py migrate
    ```

6.  **Create Superuser**:
    ```bash
    sudo docker compose -f docker-compose.prod.yml exec web python manage.py createsuperuser
    ```

7.  **Collect Static Files**:
    (This happens automatically during build in Dockerfile, but to be sure)
    ```bash
    sudo docker compose -f docker-compose.prod.yml exec web python manage.py collectstatic --no-input
    ```

## Verify Deployment
Visit `http://your-ec2-ip` in your browser. You should see the application running.
