'use client';

import { useState } from "react";
import { createRepairRequest, uploadPhoto } from "@/lib/api";

export default function UploadPage() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [userId, setUserId] = useState(1);
  const [status, setStatus] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!photo) {
      setStatus("Please select a photo before submitting.");
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const uploadResult = await uploadPhoto(photo);
      const created = await createRepairRequest({
        user_id: userId,
        photo_url: uploadResult.url,
        description,
        location,
      });
      setRequestId(created.id);
      setStatus("Repair request created successfully.");
      setDescription("");
      setLocation("");
      setPhoto(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to create request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">Upload a bike photo</h1>
      <p className="mt-2 text-slate-600">Upload a photo and create a repair request for your bike.</p>

      <form className="mt-8 space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-700">Bike photo</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none"
            type="file"
            accept="image/*"
            onChange={(event) => setPhoto(event.target.files?.[0] ?? null)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Description</label>
          <textarea
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none"
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Describe the problem or repair needed"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Location</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none"
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Neighborhood or address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Your user ID</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none"
            type="number"
            min={1}
            value={userId}
            onChange={(event) => setUserId(Number(event.target.value))}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? "Submitting..." : "Create Repair Request"}
        </button>

        {status ? <p className="text-sm text-slate-600">{status}</p> : null}
        {requestId ? <p className="text-sm text-slate-700">Request ID: {requestId}</p> : null}
      </form>
    </div>
  );
}
