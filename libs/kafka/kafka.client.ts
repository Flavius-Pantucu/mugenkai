import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "anime-manga-platform",
  brokers: ["localhost:9092"], // Update with your Kafka brokers
});

const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: "anime-manga-group" });

// Function to send a message
export const sendMessage = async (topic: string, message: string) => {
  await producer.connect();
  await producer.send({
    topic,
    messages: [{ value: message }],
  });
  await producer.disconnect();
};

// Function to consume a message
export const consumeMessages = async (topic: string) => {
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(`Received message: ${message.value?.toString()}`);
    },
  });
};
