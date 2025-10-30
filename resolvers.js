import Groq from "groq-sdk";
import fs from "fs";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Read your GraphQL schema so AI can analyze it
const schemaText = fs.readFileSync("./schema.js", "utf8");

export const resolvers = {
  Query: {
    aiAssistant: async (_, { prompt }) => {
      const completion = await groq.chat.completions.create({
        model: "llama3-70b-8192",
        messages: [
          {
            role: "system",
            content:
              "You are a GraphQL assistant that helps developers understand and fix their queries. Give clear code examples and explanations.",
          },
          {
            role: "user",
            content: `Here is the GraphQL schema:\n${schemaText}\n\nUser question: ${prompt}`,
          },
        ],
      });

      return completion.choices[0].message.content;
    },
  },
};
