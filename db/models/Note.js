import mongoose from "mongoose";

const { Schema } = mongoose;

const NoteSchema = new Schema({
  _id: { type: String, required: true },
  title: { type: String },
  text: { type: String },
  shortDescr: { type: String },
  tags: { type: [String], default: [] },
  inquiry: { type: String },
  location: { type: String },
  referenceId: { type: String },
  referenceTitle: { type: String },
  referenceReasoning: { type: String },
  discrepancyRefs: { type: [String], default: [] },
  directQuestion: { type: Boolean },
  inquiryOpen: { type: Boolean },
  inquiryOpenReasoning: { type: String },
  isReferenced: { type: Boolean },
});

const Note = mongoose.models.Note || mongoose.model("Note", NoteSchema);

export default Note;
