'use client';

import { useState } from "react";
import { createRepairRequest, uploadPhoto } from "@/lib/api";
import DashboardBackButton from "@/app/components/DashboardBackButton";

export default function UploadPage() {
  const [photo, setPhoto] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("flat tire");
  const [status, setStatus] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
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
        title,
        description,
        address,
        category,
        image_url: uploadResult.url,
      });
      setRequestId(created.id);
      setStatus("Repair request created successfully.");
      setTitle("");
      setDescription("");
      setAddress("");
      setCategory("flat tire");
      setPhoto(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to create request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <DashboardBackButton className="mb-4" />
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
          <label className="block text-sm font-medium text-slate-700">Address</label>
          <input
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none"
            type="text"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Neighborhood or address"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Category</label>
          <select
            className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="flat tire">Flat tire</option>
            <option value="brake issue">Brake issue</option>
            <option value="chain problem">Chain problem</option>
            <option value="other">Other</option>
          </select>
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
