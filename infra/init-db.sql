-- Create individual databases for each microservice
CREATE DATABASE auth_service_db;
CREATE DATABASE user_service_db;
CREATE DATABASE product_service_db;
CREATE DATABASE payment_service_db;

-- Create a dedicated user for each service (optional, for better security)
CREATE USER auth_service WITH PASSWORD 'auth123';
CREATE USER user_service WITH PASSWORD 'user123';
CREATE USER product_service WITH PASSWORD 'product123';
CREATE USER payment_service WITH PASSWORD 'payment123';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE auth_service_db TO auth_service;
GRANT ALL PRIVILEGES ON DATABASE user_service_db TO user_service;
GRANT ALL PRIVILEGES ON DATABASE product_service_db TO product_service;
GRANT ALL PRIVILEGES ON DATABASE payment_service_db TO payment_service;

-- Also grant to the main user for development convenience
GRANT ALL PRIVILEGES ON DATABASE auth_service_db TO microservices;
GRANT ALL PRIVILEGES ON DATABASE user_service_db TO microservices;
GRANT ALL PRIVILEGES ON DATABASE product_service_db TO microservices;
GRANT ALL PRIVILEGES ON DATABASE payment_service_db TO microservices; 