#!/bin/bash

# Script to create and configure Kafka Connect Elasticsearch Sink Connector

echo "Setting up Kafka Connect Elasticsearch Sink Connector..."

# Wait for Kafka Connect to be ready
echo "Waiting for Kafka Connect to be ready..."
until curl -f http://localhost:8083/; do
  echo "Kafka Connect is unavailable - sleeping"
  sleep 5
done

echo "Kafka Connect is ready!"

# Install Elasticsearch connector plugin (if not already installed)
echo "Installing Elasticsearch connector plugin..."
docker exec anineplus-kafka-connect confluent-hub install --no-prompt confluentinc/kafka-connect-elasticsearch:14.0.3

# Restart Kafka Connect to load the plugin
echo "Restarting Kafka Connect to load plugins..."
docker restart anineplus-kafka-connect

# Wait for Kafka Connect to be ready again
echo "Waiting for Kafka Connect to restart..."
sleep 30
until curl -f http://localhost:8083/; do
  echo "Kafka Connect is unavailable - sleeping"
  sleep 5
done

# Create the Elasticsearch sink connector
echo "Creating Elasticsearch sink connector..."
curl -X POST \
  http://localhost:8083/connectors \
  -H 'Content-Type: application/json' \
  -d @config/elasticsearch-sink.json

# Check connector status
echo "Checking connector status..."
curl -X GET http://localhost:8083/connectors/elasticsearch-sink-connector/status

echo "Elasticsearch sink connector setup complete!"
echo "You can monitor the connector at: http://localhost:8080 (Kafka UI)"