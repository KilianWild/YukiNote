import mongoose from "mongoose";

const { Schema } = mongoose;

const NoteSchema = new Schema({
  _id: { type: String, required: true },
  title: { type: String },
  text: { type: String },
  inquiry: { type: String },
  location: { type: String },
  reference: { type: String },
});

const Note = mongoose.models.Note || mongoose.model("Note", NoteSchema);

export default Note;
