"use client";
import { useGlobalContext } from "@/app/global-provider";
import { useEffect } from "react";
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/navigation";

export default function NoteForm({ noteToEdit }) {
  const router = useRouter();
  const formDefault = {
    title: "",
    text: "",
    inquiry: "",
  };
  const { notes, setNotes } = useGlobalContext();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState(formDefault);

  //---< get stable "isEditing" state >---
  const isEditing = mounted && !!noteToEdit;

  async function handleSubmit(event) {
    event.preventDefault();

    const formDataObject = new FormData(event.target);
    const data = Object.fromEntries(formDataObject);

    //---< reset form >---
    setFormData(formDefault);

    function getPosition() {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        });
      });
    }

    async function getLocation() {
      try {
        const position = await getPosition();
        const { latitude, longitude } = position.coords;

        const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&zoom=10`;
        const res = await fetch(url, { method: "GET" });

        if (!res.ok)
          throw new Error(`${res.status} - Failed to acquire location!`);

        return await res.json();
      } catch (error) {
        if (error instanceof GeolocationPositionError) {
          switch (error.code) {
            case 1:
              console.warn("Permission denied");
              break;
            case 2:
              console.warn("Position unavailable");
              break;
            case 3:
              console.warn("Timeout");
              break;
          }
        } else {
          console.warn("Failed to fetch location:", error.message);
        }
        return;
      }
    }

    const currentLocation = await getLocation();
    const city =
      currentLocation.address.city ??
      currentLocation.address.town ??
      currentLocation.address.village ??
      currentLocation.address.municipality ??
      currentLocation.address.county ??
      " - ";

    //---< assemble note data >---
    const newNote = {
      _id: !noteToEdit ? uuidv4() : noteToEdit._id,
      location: city,
      ...data,
    };

    //---< local storage handling >---
    if (!noteToEdit) setNotes([newNote, ...notes]);
    else
      setNotes(
        notes.map((note) =>
          note._id === noteToEdit._id ? { _id: note.id, ...data } : note,
        ),
      );

    //---< database handling - "PUT" , "POST" >---
    try {
      const url = `/api/notes${noteToEdit ? "/" + newNote._id : ""}`;
      const method = noteToEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNote),
      });

      if (!res.ok) {
        throw new Error(
          noteToEdit
            ? `${res.status} - Failed to update note!`
            : `${res.status} - Failed to add note!`,
        );
      }
    } catch (error) {
      console.error("failed to connect with database", error);
    }
  }

  function handleClearForm() {
    setFormData(formDefault);
    if (isEditing) router.push("/home");
  }

  //---< wait for mounting complete >---
  useEffect(() => {
    setMounted(true);
  }, []);

  //---< fill form with "noteToEdit" >---
  useEffect(() => {
    if (noteToEdit) setFormData(noteToEdit);
  }, [noteToEdit]);

  //---< rendering:
  //---------------------------------------------------------------------------------------
  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full w-full flex-col justify-center bg-zinc-900 p-6"
    >
      <h2 className="self-center text-lg font-semibold text-zinc-700">
        New Note
      </h2>

      <input
        name="title"
        type="text"
        value={formData.title}
        onChange={(event) => {
          setFormData((prev) => ({ ...prev, title: event.target.value }));
        }}
        placeholder="Title"
        className="mt-3 w-[80%] border-b-2 border-[#4a4a6a] p-2 text-sm focus:outline-none"
      />

      <textarea
        name="text"
        value={formData.text}
        onChange={(event) =>
          setFormData((prev) => ({ ...prev, text: event.target.value }))
        }
        placeholder="Write your note..."
        className="notebook mt-3 mb-0 flex-1 resize-none rounded border-none px-2 pb-2 text-sm focus:outline-none"
      />

      <input
        name="inquiry"
        type="text"
        onChange={(event) =>
          setFormData((prev) => ({ ...prev, inquiry: event.target.value }))
        }
        value={formData.inquiry}
        placeholder="Theme of Inquiry"
        className="right-0 mt-0 w-[80%] self-end border-b-2 border-[#4a4a6a] px-2 pb-2 text-sm focus:outline-none"
      />

      <div className="mt-10 flex flex-row justify-center gap-3">
        <button
          type="button"
          onClick={handleClearForm}
          className="rounded bg-teal-600 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-300"
        >
          {isEditing ? "Cancel" : "Clear"}
        </button>
        <button
          type="submit"
          className="rounded bg-teal-600 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-300"
        >
          {isEditing ? "Update Note" : "Save Note"}
        </button>
      </div>
    </form>
  );
}
