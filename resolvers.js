import Groq from "groq-sdk";
import fs from "fs";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Read your GraphQL schema so AI can analyze it
const schemaText = fs.readFileSync("./schema.js", "utf8");

let books = [
  { id: '1', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
  { id: '2', title: 'To Kill a Mockingbird', author: 'Harper Lee' },
];

export const resolvers = {
  Query: {
    aiAssistant: async (_, { prompt }) => {
      const completion = await groq.chat.completions.create({
        model: "llama3-8b-8192",
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
        throw new new Error("Book not found");
      }
      const [deletedBook] = books.splice(bookIndex, 1);
      return deletedBook;
    },
  },
};