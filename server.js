import express from "express";
import { graphqlHTTP } from "express-graphql";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GraphQLObjectType, GraphQLSchema, GraphQLString, GraphQLList } from "graphql";
import Groq from "groq-sdk";

dotenv.config();

const app = express();
const PORT = 4000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🧠 Initialize Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// 🗄️ MongoDB
mongoose
  .connect("mongodb+srv://shradhacg_db_user:uAgYioDL4CMsaLNk@cluster0.zlkdxql.mongodb.net/test", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// 🔹 MongoDB Schemas
const teamSchema = new mongoose.Schema({ name: String });
const playerSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  team_id: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
});

const Team = mongoose.model("Team", teamSchema);
const Player = mongoose.model("Player", playerSchema);

// 🔹 GraphQL Types
const TeamType = new GraphQLObjectType({
  name: "Team",
  fields: () => ({
    id: { type: GraphQLString },
    name: { type: GraphQLString },
  }),
});

const PlayerType = new GraphQLObjectType({
  name: "Player",
  fields: () => ({
    id: { type: GraphQLString },
    first_name: { type: GraphQLString },
    last_name: { type: GraphQLString },
    team: {
      type: TeamType,
      resolve: (player) => Team.findById(player.team_id),
    },
  }),
});

// 🔹 Root Query
const RootQuery = new GraphQLObjectType({
  name: "Query",
  fields: {
    players: {
      type: new GraphQLList(PlayerType),
      resolve: () => Player.find(),
    },
    aiHelp: {
      type: GraphQLString,
      args: { question: { type: GraphQLString } },
      async resolve(_, { question }) {
        try {
          const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
              {
                role: "system",
                content: "You are a GraphQL tutor that explains and writes GraphQL queries clearly.",
              },
              { role: "user", content: question },
            ],
          });
          return response.choices[0].message.content;
        } catch (err) {
          console.error("Groq AI error:", err);
          return "Error fetching AI response.";
        }
      },
    },
  },
});

// 🔹 Mutation
const Mutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    addPlayer: {
      type: PlayerType,
      args: {
        first_name: { type: GraphQLString },
        last_name: { type: GraphQLString },
        team_id: { type: GraphQLString },
      },
      resolve: async (_, args) => {
        const player = new Player(args);
        return await player.save();
      },
    },
  },
});

const schema = new GraphQLSchema({
  query: RootQuery,
  mutation: Mutation,
});

// 🧩 GraphQL endpoint
app.use(
  "/api",
  graphqlHTTP({
    schema: schema,
    graphiql: true,
  })
);

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

app.listen(PORT, () =>
  console.log(`✅ Server running at http://localhost:${PORT}`)
);
