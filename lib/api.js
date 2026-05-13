export async function notesApiPutPost(dbMethod, newNote, id) {
  try {
    const url = `/api/notes${dbMethod === "PUT" ? "/" + id : ""}`;
    const method = dbMethod;

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newNote),
    });

    if (!res.ok) {
      throw new Error(
        dbMethod === "PUT"
          ? `${res.status} - Failed to update note!`
          : `${res.status} - Failed to add note!`,
      );
    }
  } catch (error) {
    console.error("failed to connect with database", error);
  }
}

export async function notesApiBulk(notes) {
  try {
    const url = `/api/notes/bulk`;
    const method = "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(notes),
    });

    if (!res.ok) {
      throw new Error(`${res.status} - Failed to bulk update notes!`);
    }
  } catch (error) {
    console.error("failed to connect with database", error);
  }
}
