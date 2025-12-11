import React, { useState } from 'react';
import { Badge, ChevronDown, ChevronUp } from 'lucide-react';
import { POI } from '../types';
import { mockSummary } from '../mockData';

interface POIInsightsProps {
  onNavigate: (view: string, data?: any) => void;
  onBack: () => void;
}

export function POIInsights({ onNavigate, onBack }: POIInsightsProps) {
  const [selectedPOI, setSelectedPOI] = useState<POI | null>(
    mockSummary.top_pois[0]
  );
  const pois = mockSummary.top_pois;

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'bg-red-100 border-red-200 text-red-900';
    if (score >= 60) return 'bg-orange-100 border-orange-200 text-orange-900';
    if (score >= 40)
      return 'bg-amber-100 border-amber-200 text-amber-900';
    return 'bg-slate-100 border-slate-200 text-slate-900';
  };

  const getRiskBadge = (score: number) => {
    if (score >= 80)
      return 'bg-red-600 text-white px-3 py-1 rounded text-sm font-bold';
    if (score >= 60)
      return 'bg-orange-600 text-white px-3 py-1 rounded text-sm font-bold';
    if (score >= 40)
      return 'bg-amber-600 text-white px-3 py-1 rounded text-sm font-bold';
    return 'bg-slate-600 text-white px-3 py-1 rounded text-sm font-bold';
  };

  const getRiskBarColor = (score: number) => {
    if (score >= 80) return 'bg-red-500';
    if (score >= 60) return 'bg-orange-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-slate-500';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">
              Persons of Interest
            </h1>
            <button
              onClick={onBack}
              className="text-slate-600 hover:text-slate-900 transition"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-lg border border-slate-200 mb-8 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-700">
                    Rank
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-700">
                    Contact Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-700">
                    Phone
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-700">
                    Risk Score
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-700">
                    Suspicious Msgs
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-slate-700">
                    Flagged Media
                  </th>
                </tr>
              </thead>
              <tbody>
                {pois.map((poi, idx) => (
                  <tr
                    key={poi.id}
                    onClick={() => setSelectedPOI(poi)}
                    className={`border-b border-slate-200 hover:bg-slate-50 cursor-pointer transition ${
                      selectedPOI?.id === poi.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      #{idx + 1}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {poi.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 font-mono">
                      {poi.phone.substring(0, 8)}...
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-slate-900">
                          {poi.score}%
                        </span>
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getRiskBarColor(poi.score)}`}
                            style={{ width: `${poi.score}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {poi.feature_breakdown.suspicious_msg_count}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                      {poi.feature_breakdown.flagged_media_assoc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {selectedPOI && (
          <div className={`bg-white rounded-lg border border-slate-200 p-8 ${getRiskColor(selectedPOI.score)}`}>
            <div className="mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedPOI.name}
                  </h2>
                  <p className="text-slate-600 mt-1">
                    {selectedPOI.phone}
                    {selectedPOI.email && ` • ${selectedPOI.email}`}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-slate-900">
                    {selectedPOI.score}%
                  </div>
                  <span className={getRiskBadge(selectedPOI.score)}>
                    {selectedPOI.score >= 80
                      ? 'CRITICAL'
                      : selectedPOI.score >= 60
                        ? 'HIGH RISK'
                        : selectedPOI.score >= 40
                          ? 'MODERATE'
                          : 'LOW RISK'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Risk Score Breakdown
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Suspicious Messages
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {selectedPOI.feature_breakdown.suspicious_msg_count}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{
                        width: `${(selectedPOI.feature_breakdown.suspicious_msg_count / selectedPOI.feature_breakdown.total_messages) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Flagged Media Associated
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {selectedPOI.feature_breakdown.flagged_media_assoc}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500"
                      style={{
                        width: `${selectedPOI.feature_breakdown.flagged_media_assoc * 15}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Time Anomaly Score
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {(selectedPOI.feature_breakdown.time_anomaly_score * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500"
                      style={{
                        width: `${selectedPOI.feature_breakdown.time_anomaly_score * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-700">
                      Total Messages
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {selectedPOI.feature_breakdown.total_messages}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{
                        width: `${(selectedPOI.feature_breakdown.total_messages / 100) * 30}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8 pt-8 border-t border-slate-300">
              <h3 className="text-lg font-bold text-slate-900 mb-4">
                Evidence References ({selectedPOI.evidence_refs.message_ids.length + selectedPOI.evidence_refs.media_ids.length} items)
              </h3>
              <div className="space-y-2">
                {selectedPOI.evidence_refs.message_ids.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      Messages ({selectedPOI.evidence_refs.message_ids.length})
                    </p>
                    <ul className="space-y-2">
                      {selectedPOI.evidence_refs.message_ids.slice(0, 3).map(
                        (msgId) => (
                          <li
                            key={msgId}
                            className="flex items-center justify-between bg-slate-50 p-3 rounded border border-slate-300"
                          >
                            <span className="text-sm text-slate-700">
                              Message {msgId}
                            </span>
                            <button
                              onClick={() => onNavigate('chat')}
                              className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                            >
                              View →
                            </button>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {selectedPOI.evidence_refs.media_ids.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-slate-700 mb-2">
                      Media ({selectedPOI.evidence_refs.media_ids.length})
                    </p>
                    <ul className="space-y-2">
                      {selectedPOI.evidence_refs.media_ids.slice(0, 3).map(
                        (mediaId) => (
                          <li
                            key={mediaId}
                            className="flex items-center justify-between bg-slate-50 p-3 rounded border border-slate-300"
                          >
                            <span className="text-sm text-slate-700">
                              {mediaId}
                            </span>
                            <button
                              onClick={() => onNavigate('media')}
                              className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
                            >
                              View →
                            </button>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-8 border-t border-slate-300 flex gap-3">
              <button
                onClick={() => onNavigate('chat')}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
              >
                Open All Conversations
              </button>
              <button
                onClick={() => onNavigate('timeline')}
                className="flex-1 px-4 py-3 bg-slate-200 text-slate-900 rounded-lg hover:bg-slate-300 transition font-semibold"
              >
                View on Timeline
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
