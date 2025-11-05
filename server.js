import "dotenv/config";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { typeDefs } from "./schema.js";
import { resolvers } from "./resolvers.js";
import mongoose from "mongoose";

const app = express();
const port = 3000;

// Connect to MongoDB if a URI is provided
if (process.env.MONGODB_URI) {
  mongoose
    .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));
} else {
    console.log("MONGODB_URI not found, skipping database connection.");
}

const server = new ApolloServer({ typeDefs, resolvers });

async function startServer() {
  await server.start();
  server.applyMiddleware({ app, path: "/api" });

  app.use(express.static("public"));

  app.listen(port, () => {
    console.log(`Server ready at http://localhost:${port}`);
    console.log(`GraphQL Playground at http://localhost:${port}/api`);
  });
}

startServer();