import { gql } from "apollo-server-express";

export const typeDefs = gql`
  type Query {
    aiAssistant(prompt: String!): String
    books: [Book]
  }

  type Book {
    id: ID!
    title: String!
    author: String!
  }

  type Mutation {
    addBook(title: String!, author: String!): Book
    updateBook(id: ID!, title: String, author: String): Book
    deleteBook(id: ID!): Book
  }
`;
