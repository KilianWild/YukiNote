import dbConnect from "@/db/dbConnect";
import Note from "@/db/models/Note";

export async function PUT(request, { params }) {
  await dbConnect();

  const { id } = await params;
  const notes = await request.json();
  const updated = await Note.findByIdAndUpdate(id, notes, {
    returnDocument: "after",
  });

  return Response.json(updated);
}

export async function DELETE(_, { params }) {
  await dbConnect();

  const { id } = await params;
  const deleted = await Note.findByIdAndDelete(id);

  return Response.json(
    { message: "Deleted successfully", deleted },
    { status: 200 },
  );
}
