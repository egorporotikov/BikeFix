'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getRepairRequest, listOffers, selectOffer, createReview, completeRepairRequest } from '@/lib/api';
import type { Offer } from '@/types';

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

interface RepairRequest {
  id: string;
  title: string;
  description: string;
  address: string;
  category: string;
  status: string;
  image_url: string | null;
  mechanic_profile_id: string | null;
  mechanic_name?: string;
  mechanic_profile_image_url?: string | null;
  mechanic_is_verified?: boolean | null;
  is_verified?: boolean | null;
  created_at: string;
  updated_at: string;
}

export default function RequestDetailPage() {
  const params = useParams();
  const requestId = params.id as string;
  const [request, setRequest] = useState<RepairRequest | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [selectingOfferId, setSelectingOfferId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewStatus, setReviewStatus] = useState<string | null>(null);
  const [completing, setCompleting] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const [requestData, offersData] = await Promise.all([
          getRepairRequest(requestId),
          listOffers(requestId),
        ]);
        setRequest(requestData as RepairRequest);
        setOffers(offersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (requestId) {
      fetchRequest();
    }
  }, [requestId]);

  const formatDate = (isoDate: string) => {
    return new Date(isoDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSelectOffer = async (offerId: string) => {
    if (!requestId) return;
    setActionError('');
    setSelectingOfferId(offerId);

    try {
      const selected = await selectOffer(requestId, offerId);
      setOffers((current) =>
        current.map((offer) =>
          offer.id === selected.id
            ? { ...offer, status: selected.status }
            : offer.status === 'pending'
            ? { ...offer, status: 'rejected' }
            : offer,
        ),
      );

      setRequest((current) =>
        current
          ? {
              ...current,
              status: 'accepted',
              mechanic_profile_id: selected.mechanic_profile_id,
              mechanic_name: selected.mechanic_name,
              mechanic_profile_image_url: selected.mechanic_profile_image_url,
              is_verified: selected.mechanic_is_verified,
            }
          : current,
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to select offer.');
    } finally {
      setSelectingOfferId(null);
    }
  };

  const handleCompleteRequest = async () => {
    if (!requestId) return;
    setActionError('');
    setCompleting(true);

    try {
      const updatedRequest = await completeRepairRequest(requestId);
      setRequest(updatedRequest as RepairRequest);
      setReviewStatus('Request marked as completed. You can now leave a review.');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to complete request.');
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl text-center py-8">
          <p className="text-gray-600">Loading request details...</p>
        </div>
      </main>
    );
  }

  if (error || !request) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-4xl">
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4">
            {error || 'Request not found'}
          </div>
          <Link href="/user/requests" className="text-blue-600 hover:text-blue-700">
            ← Back to Requests
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        <Link href="/user/requests" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Requests
        </Link>

        <div className="bg-white rounded-lg shadow p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">{request.title}</h1>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(request.status)}`}>
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Category</p>
              <p className="text-lg font-semibold">{request.category}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Address</p>
              <p className="text-lg font-semibold">{request.address}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-lg font-semibold">{formatDate(request.created_at)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Updated</p>
              <p className="text-lg font-semibold">{formatDate(request.updated_at)}</p>
            </div>
          </div>

          <div className="mb-6 border-t pt-6">
            <h2 className="text-xl font-semibold mb-3">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{request.description}</p>
          </div>

          {request.image_url && (
            <div className="mb-6 border-t pt-6">
              <h2 className="text-xl font-semibold mb-3">Image</h2>
              <img src={request.image_url} alt={request.title} className="mt-3 max-w-full h-auto rounded-lg shadow" />
            </div>
          )}

          {!request.mechanic_profile_id && request.status === 'pending' && (
            <div className="mb-6 border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Offers</h2>
              {actionError && (
                <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
                  {actionError}
                </div>
              )}
              {offers.length === 0 ? (
                <p className="text-gray-600">No offers have been submitted yet.</p>
              ) : (
                <div className="space-y-4">
                  {offers.map((offer) => (
                    <div key={offer.id} className="rounded-3xl border border-slate-200 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="flex items-center gap-2 mb-2">
                            <Link href={`/mechanics/${offer.mechanic_profile_id}`} className="text-sm font-semibold text-blue-600 hover:text-blue-700">
                              {offer.mechanic_name}
                            </Link>
                            {offer.mechanic_is_verified && <VerifiedBadge />}
                          </p>
                          <p className="text-sm text-slate-500">Price: ${offer.price.toFixed(2)}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-slate-700">
                          {offer.status}
                        </span>
                      </div>
                      <p className="mt-3 text-slate-700">{offer.description}</p>
                      {offer.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleSelectOffer(offer.id)}
                          disabled={selectingOfferId === offer.id}
                          className="mt-4 rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
                        >
                          {selectingOfferId === offer.id ? 'Selecting...' : 'Select this mechanic'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {request.mechanic_profile_id && (
            <div className="mb-6 border-t pt-6">
              <h2 className="text-xl font-semibold mb-3">Assigned mechanic</h2>
              <div className="flex items-center gap-2 mb-4">
                <Link href={`/mechanics/${request.mechanic_profile_id}`} className="text-blue-600 hover:text-blue-700 font-semibold">
                  {request.mechanic_name || request.mechanic_profile_id}
                </Link>
                {request.mechanic_is_verified && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href={`/chat/${request.id}`}
                  className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Open Chat
                </Link>
                {request.status === 'accepted' && (
                  <button
                    type="button"
                    onClick={handleCompleteRequest}
                    disabled={completing}
                    className="inline-block rounded-2xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {completing ? 'Completing…' : 'Mark as completed'}
                  </button>
                )}
              </div>
              {actionError && (
                <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
                  {actionError}
                </div>
              )}
            </div>
          )}

          {request.status === 'completed' && request.mechanic_profile_id && (
            <div className="mb-6 border-t pt-6">
              <h2 className="text-xl font-semibold mb-3">Leave a review for your mechanic</h2>
              {reviewStatus && <p className="text-slate-600">{reviewStatus}</p>}
              <div className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-slate-700">Rating</label>
                <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))} className="rounded-xl border border-slate-300 px-4 py-2">
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Very good</option>
                  <option value={3}>3 - Good</option>
                  <option value={2}>2 - Fair</option>
                  <option value={1}>1 - Poor</option>
                </select>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Comment</label>
                  <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3" rows={4} />
                </div>

                <div>
                  <button
                    className="rounded-2xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                    onClick={async () => {
                      setReviewStatus(null);
                      try {
                        await createReview({ request_id: request.id, rating: reviewRating, comment: reviewComment });
                        setReviewStatus('Review submitted. Redirecting to mechanic profile...');
                        // redirect to mechanic profile to view updated stats
                        router.push(`/mechanics/${request.mechanic_profile_id}`);
                      } catch (err) {
                        setReviewStatus(err instanceof Error ? err.message : 'Unable to submit review.');
                      }
                    }}
                  >
                    Submit review
                  </button>
                </div>
              </div>
            </div>
          )}

          {!request.mechanic_profile_id && request.status !== 'pending' && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-6">
              <p className="text-blue-800">You can only assign a mechanic while the request is pending.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
