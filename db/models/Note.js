import mongoose from "mongoose";

const { Schema } = mongoose;

const NoteSchema = new Schema({
  _id: { type: String, required: true },
  title: { type: String },
  text: { type: String },
  shortdesc: { type: String },
  tags: { type: [String], default: [] },
  inquiry: { type: String },
  location: { type: String },
  referencelink: { type: String },
});

const Note = mongoose.models.Note || mongoose.model("Note", NoteSchema);

export default Note;
