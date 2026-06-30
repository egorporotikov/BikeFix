'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PriceInput from "@/app/components/PriceInput";
import RequestId from "@/app/components/RequestId";
import { createOffer, getRepairRequest, listOffers } from "@/lib/api";
import type { Offer, RepairRequest } from "@/types";

function VerifiedBadge() {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
      <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
          clipRule="evenodd"
        />
      </svg>
    </span>
  );
}

export default function RepairRequestDetailsPage() {
  const params = useParams();
  const requestId = Array.isArray(params?.id) ? params.id[0] : params?.id ?? "";

  const [request, setRequest] = useState<RepairRequest | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!requestId) return;
      setLoading(true);
      try {
        const [requestData, offersData] = await Promise.all([
          getRepairRequest(requestId),
          listOffers(requestId)
        ]);
        setRequest(requestData);
        setOffers(offersData);
      } catch (exception) {
        setError(exception instanceof Error ? exception.message : "Unable to load request details.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [requestId]);

  const handleOfferSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!requestId) return;

    // 🔥 Улучшенная валидация
    if (price === null || price <= 0) {
      setStatus("Please enter a valid offer price.");
      return;
    }

    if (!message.trim()) {
      setStatus("Please enter a message before submitting.");
      return;
    }

    setStatus(null);

    try {
      const createdOffer = await createOffer(requestId, {
        price,
        message,
      });

      setOffers((current) => [createdOffer, ...current]);
      setMessage("");
      setStatus("Offer submitted successfully.");
    } catch (exception: any) {
      if (exception instanceof Error) {
        setStatus(exception.message);
      } else if (exception?.detail) {
        setStatus(exception.detail);
      } else {
        setStatus("Unable to submit offer. Please try again.");
      }
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-slate-900">Repair request details</h1>
        <p className="mt-2 text-slate-600">Review the request and create a mechanic offer.</p>
      </div>

      {loading ? (
        <p className="text-slate-600">Loading request...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : !request ? (
        <p className="text-slate-600">Request not found.</p>
      ) : (
        <div className="space-y-8">
          
          {/* Request Info */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-semibold text-slate-900">Request</h2>
                  <RequestId value={request.id} />
                </div>
                <p className="mt-1 text-sm text-slate-500">{request.address}</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-700">
                {request.status}
              </span>
            </div>

            <p className="mt-6 text-slate-700">{request.description}</p>

            <img
              src={request.image_url ?? ""}
              alt={`Repair ${request.id}`}
              className="mt-6 max-h-[320px] w-full rounded-3xl object-cover"
            />
          </section>

          {/* Offer Form */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Submit an offer</h3>

            <form className="mt-6 space-y-4" onSubmit={handleOfferSubmit}>
              
              <PriceInput
                value={price}
                onValueChange={setPrice}
                label="Offer price"
                className="max-w-sm"
              />

              <div>
                <label className="block text-sm font-medium text-slate-700">Message</label>
                <textarea
                  className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 focus:border-sky-500 focus:outline-none"
                  rows={4}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                />
              </div>

              <button
                className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                type="submit"
              >
                Send offer
              </button>
            </form>

            {status && (
              <p className="mt-4 text-slate-600">{status}</p>
            )}
          </section>

          {/* Offers List */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-slate-900">Offers</h3>

            {offers.length === 0 ? (
              <p className="mt-4 text-slate-600">No offers yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                {offers.map((offer) => (
                  <div key={offer.id} className="rounded-3xl border border-slate-200 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        {offer.mechanic_name}
                        {offer.mechanic_is_verified && <VerifiedBadge />}
                      </p>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-700">
                        {offer.status}
                      </span>
                    </div>

                    <p className="mt-3 text-slate-700">{offer.description}</p>

                    <p className="mt-3 text-sm text-slate-500">
                      Price: €{offer.price.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  );
}
