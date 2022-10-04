import { ApolloServer } from 'apollo-server';
import SchemaBuilder from '@pothos/core';

const builder = new SchemaBuilder({});


builder.queryType({
  fields: (t) => ({
    hello: t.string({
      args: {
        name: t.arg.string(),
        names: t.arg.stringList()
      },
      resolve: (parent, { name, names }) => {
        return `hello, ${name || names?.join(", ") || 'World'}`
      },
    }),
  }),
});

const server = new ApolloServer({
  schema: builder.toSchema(),
});

server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});