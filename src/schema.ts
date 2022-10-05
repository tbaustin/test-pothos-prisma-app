import { builder } from "./builder";
import { prisma } from "./prismaClient"

builder.prismaObject('User', {
  fields: (t) => ({
    id: t.exposeID("id"),
    email: t.exposeString("email"),
    name: t.string({
      nullable: true,
      resolve: (user) => user.name
    }),
    // Load posts as list field.
    posts: t.relation('posts', {
      args: {
        oldestFirst: t.arg.boolean(),
      },
      // Define custom query options that are applied when
      // loading the post relation
      query: (args, context) => ({
        orderBy: {
          createdAt: args.oldestFirst ? 'asc' : 'desc',
        },
      }),
    }),
    // creates relay connection that handles pagination
    // using prisma's built in cursor based pagination
    postsConnection: t.relatedConnection('posts', {
      cursor: 'id',
    }),
    // Prisma Connection
    postsTwoConnection: t.prismaConnection(
      {
        type: 'Post',
        cursor: 'id',
        resolve: (query, parent, args, context, info) => {
          console.log(`Parent: `, parent)
          console.log(`args: `, args)
          console.log(`context: `, context)
          console.log(`info: `, info)
          return prisma.post.findMany({ ...query })
        },
      }
    )
  }),
})

// Create a relay node based a prisma model
builder.prismaNode('Post', {
  id: { field: 'id' },
  fields: (t) => ({
    title: t.exposeString('title'),
    author: t.relation('author'),
  }),
});

builder.queryType({
  fields: (t) => ({
    // Define a field that issues an optimized prisma query
    user: t.prismaField({
      type: 'User',
      args: {
        id: t.arg.int({ required: true })
      },
      resolve: async (query, _, args) =>{
        return prisma.user.findUniqueOrThrow({
          // the `query` argument will add in `include`s or `select`s to
          // resolve as much of the request in a single query as possible
          ...query,
          where: { id: args.id },
        })
      },
    }),
  }),
});

const UserInput = builder.inputType('UserInput', {
  fields: (t) => ({
    email: t.string({ required: true }),
    name: t.string()
  }),
});

builder.mutationType({
  fields: (t) => ({
    createUser: t.prismaField({
      type: 'User',
      args: {
        user: t.arg({ type: UserInput, required: true })
      },
      resolve: (query, _root, args) => {
        return prisma.user.create({ 
          ...query, 
          data: args.user 
        })
      }
    })
  })
})

export const schema = builder.toSchema();