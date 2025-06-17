import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Performer: a
    .model({
      id: a.id(),
      name: a.string().required(),
      skills: a.string().array().required(), // For selectable skills
      performances: a.string().array(), // For free-form descriptions
      availableTimes: a.string().array(), // For available times
    })
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});