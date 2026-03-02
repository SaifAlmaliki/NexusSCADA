/**
 * Shared MQTT client for platform (Next.js API) to publish to the central broker.
 * Used by connector write and edge config push.
 */
import mqtt from 'mqtt';

const MQTT_URL = process.env.MQTT_URL || 'mqtt://localhost:1883';

let mqttClient: mqtt.MqttClient | null = null;

export function getMqttClient(): mqtt.MqttClient {
  if (!mqttClient || !mqttClient.connected) {
    mqttClient = mqtt.connect(MQTT_URL);
  }
  return mqttClient;
}
