"use client";
import NoteCard from "./NoteCard";
import { useGlobalContext } from "@/app/global-provider";
import { useState, useEffect } from "react";

export default function NoteCardList({ handleClickEdit, handleClickDelete }) {
  const { notes, setNotes } = useGlobalContext();
  const [isMounted, setIsMounted] = useState(false);

  //---< wait for mounting complete >---
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  //---< rendering:
  //---------------------------------------------------------------------------------------
  return (
    <ul className="flex flex-col gap-3 p-4">
      {notes.map((note, index) => {
        return (
          <NoteCard
            onClickEdit={handleClickEdit}
            onClickDelete={handleClickDelete}
            note={note}
            key={index}
          />
        );
      })}
    </ul>
  );
}
