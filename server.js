const express = require("express");
const bodyParser = require("body-parser");
const express_graphql = require("express-graphql");
const { makeExecutableSchema } = require("graphql-tools");
const fetch = require("node-fetch");
const cors = require("cors");

const THEMOVIEDB_API_PATH = "https://api.themoviedb.org/3";

const typeDefs = String.raw`
  type Query {
    movies(query: String!, page: Int): [Movie]
    movie(id: Int!): Movie
  }
  type Movie {
    id: Int
    title: String
    release_date: String
    popularity: Float
    overview: String
  }
`;

const resolvers = {
  Query: {
    movies: (root, args, context) => {
      const page = args.page || 1;
      return fetch(
        `${THEMOVIEDB_API_PATH}/search/movie?api_key=${
          context.secrets.THEMOVIEDB_API_KEY
          }&query=${args.query}&language=en-US&page=${page}`
      )
        .then(res => res.json())
        .then(({ results }) => results);
    },
    movie: (root, args, context) => {
      return fetch(
        `${THEMOVIEDB_API_PATH}/movie/${args.id}?api_key=${
          context.secrets.THEMOVIEDB_API_KEY
          }`
      ).then(res => res.json());
    }
  }
};

const schema = makeExecutableSchema({
  typeDefs,
  resolvers
});

const app = express();

if (!process.env.THEMOVIEDB_API_KEY) {
  throw new Error(
    "Please provide an API key for themoviedb.org in the environment variable THEMOVIEDB_API_KEY."
  );
}

const PORT = process.env.PORT || 4000;

app.use(cors());

// The GraphQL endpoint
app.use("/graphql", bodyParser.json(),
  express_graphql({
    schema,
    tracing: true,
    graphiql: true,
    cacheControl: true,
    context: {
      secrets: {
        THEMOVIEDB_API_KEY: process.env.THEMOVIEDB_API_KEY
      }
    }
  })
);

app.use(express.static("public"));

app.listen(PORT, () => console.log(`Express GraphQL Server Now Running On localhost:${PORT}/graphql`));

