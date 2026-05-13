import dbConnect from "@/db/dbConnect";
import Note from "@/db/models/Note";

export async function POST(request) {
  await dbConnect();

  const notes = await request.json();

  const operations = notes.map((note) => {
    const { _id, ...rest } = note;

    return {
      updateOne: {
        filter: { _id },
        update: { $set: rest },
        upsert: false,
      },
    };
  });

  const updated = await Note.bulkWrite(operations);

  return Response.json(updated);
}
