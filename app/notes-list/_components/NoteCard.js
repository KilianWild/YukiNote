"use client";
import { useState } from "react";
import { useRef } from "react";
import { useEffect } from "react";

export default function NoteCard({ note, onClickEdit, onClickDelete }) {
  const [menuExpanded, setMenuExpanded] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    //---< close menu by click outside >---
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target))
        setMenuExpanded(false);
    }

    window.addEventListener("click", (event) => handleClickOutside(event));
  }, []);

  //---< rendering:
  //---------------------------------------------------------------------------------------
  return (
    <li
      onDoubleClick={() => onClickEdit(note._id)}
      className="relative h-50 w-full rounded-tl-lg rounded-br-lg border border-b-2 border-[#4a4a6a] bg-zinc-900"
    >
      <div ref={menuRef}>
        <button
          onClick={() => setMenuExpanded((prev) => !prev)}
          className="absolute right-0 flex h-5 w-9 flex-col justify-between rounded-sm border border-zinc-700 bg-zinc-800 p-1"
        >
          <span className="h-px w-full bg-zinc-400"></span>
          <span className="h-px w-full bg-zinc-400"></span>
          <span className="h-px w-full bg-zinc-400"></span>
        </button>

        {menuExpanded && (
          <div className="absolute right-0 z-100 flex h-14 w-20 flex-col border border-zinc-700 bg-zinc-800">
            <button
              onClick={() => onClickEdit(note._id)}
              className="0 w-full flex-1 border-b border-zinc-700"
            >
              Edit
            </button>
            <button
              onClick={() => {
                setMenuExpanded(false);
                onClickDelete(note._id);
              }}
              className="w-full flex-1"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <h3 className="absolute top-3 left-3 font-bold text-zinc-300">
        {note.title}
      </h3>
      <p className="absolute top-11 left-3 font-thin whitespace-pre-line text-zinc-400">
        {note.text.length > 250
          ? note.text.slice(0, 250).replace(/\r?\n/g, " ").trim() + " ..."
          : note.text.replace(/\r?\n/g, " ").trim()}
      </p>
      <p className="absolute bottom-1 left-3 text-zinc-500">{note.location}</p>
      <h4 className="absolute right-2 bottom-1 text-[#7e7eb4]">
        {note.inquiry}
      </h4>
      <h4 className="absolute right-2 bottom-7">{note.reference}</h4>
    </li>
  );
}
