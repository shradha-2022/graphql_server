import Groq from "groq-sdk";
import fs from "fs";

// Initialize Groq client lazily to ensure env vars are loaded
let groq = null;

function getGroqClient() {
  if (!groq && process.env.GROQ_API_KEY) {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }
  return groq;
}

// Read your GraphQL schema so AI can analyze it
const schemaText = fs.readFileSync("./schema.js", "utf8");

let books = [
  { id: '1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
  { id: '2', title: 'To Kill a Mockingbird', author: 'Harper Lee' },
];

export const resolvers = {
  Query: {
    aiAssistant: async (_, { prompt }) => {
      try {
        if (!process.env.GROQ_API_KEY) {
          throw new Error("GROQ_API_KEY is not configured. Please check your .env file.");
        }

        if (!prompt || prompt.trim().length === 0) {
          return "Please provide a question or prompt for the AI assistant.";
        }

        const groqClient = getGroqClient();
        if (!groqClient) {
          throw new Error("Failed to initialize Groq client. Please check your API key.");
        }

        const completion = await groqClient.chat.completions.create({
          model: "llama-3.1-8b-instant",
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

        return completion.choices[0].message.content || "No response from AI.";
      } catch (error) {
        console.error("AI Assistant Error:", error);
        return `Error: ${error.message || "Failed to get AI response. Please check your API key and try again."}`;
      }
    },
    books: () => books,
  },
  Mutation: {
    addBook: (_, { title, author }) => {
      const newBook = { id: String(books.length + 1), title, author };
      books.push(newBook);
      return newBook;
    },
    updateBook: (_, { id, title, author }) => {
      const bookIndex = books.findIndex((book) => book.id === id);
      if (bookIndex === -1) {
        throw new Error("Book not found");
      }
      if (title) {
        books[bookIndex].title = title;
      }
      if (author) {
        books[bookIndex].author = author;
      }
      return books[bookIndex];
    },
    deleteBook: (_, { id }) => {
      const bookIndex = books.findIndex((book) => book.id === id);
      if (bookIndex === -1) {
        throw new Error("Book not found");
      }
      const [deletedBook] = books.splice(bookIndex, 1);
      return deletedBook;
    },
  },
};