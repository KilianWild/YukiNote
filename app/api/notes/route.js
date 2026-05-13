import dbConnect from "@/db/dbConnect";
import Note from "@/db/models/Note";

export async function GET() {
  await dbConnect();

  const notes = await Note.find({}).sort({ _id: -1 });
  return Response.json(notes, { status: 200 });
}

export async function POST(request) {
  await dbConnect();

  try {
    const notes = await request.json();
    const note = await Note.create(notes);

    return Response.json(note, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
