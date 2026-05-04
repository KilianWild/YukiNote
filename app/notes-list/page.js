"use client";
import { useRouter } from "next/navigation";
import { useGlobalContext } from "@/app/global-provider";
import useGesture from "@/hooks/useGesture";
import NoteCardList from "./_components/NoteCardList";

export default function NoteList() {
  const router = useRouter();
  const { notes, setNotes } = useGlobalContext();

  function handleClickEdit(id) {
    const noteToEdit = notes.find((note) => note._id === id);
    router.push(`/note-editor?editid=${noteToEdit._id}`);
  }

  async function handleClickDelete(id) {
    //---< database handling - "DELETE" >---
    const url = `/api/notes/${id}`;
    const method = "DELETE";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      throw new Error(`${res.status} - Failed to delete note!`);
    }

    setNotes((prev) => prev.filter((note) => (note._id !== id ? note : null)));
  }

  useGesture(50, (direction) => {
    if (direction === "left") router.push("/note-editor");
  });

  //---< rendering:
  //---------------------------------------------------------------------------------------
  return (
    <>
      <NoteCardList
        handleClickEdit={handleClickEdit}
        handleClickDelete={handleClickDelete}
      />
    </>
  );
}
