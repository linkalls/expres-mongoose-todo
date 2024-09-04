import mongoose from "mongoose";
const { Schema } = mongoose;

const todoSchema = new Schema({
  title: String,
  isDone: Boolean,
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
});

export const Todo = mongoose.model("Todo", todoSchema);