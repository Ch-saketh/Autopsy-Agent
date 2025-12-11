import React, { useState } from 'react';
import { MessageSquare, Search, ChevronDown, AlertTriangle } from 'lucide-react';
import { Message } from '../types';
import { mockMessages } from '../mockData';

interface ChatExplorerProps {
  onNavigate: (view: string, data?: any) => void;
  onBack: () => void;
}

export function ChatExplorer({ onNavigate, onBack }: ChatExplorerProps) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showSuspiciousOnly, setShowSuspiciousOnly] = useState(true);
  const [searchText, setSearchText] = useState('');

  const contacts = Array.from(
    new Map(
      mockMessages
        .flatMap((m) => [
          {
            id: m.sender_id,
            name: m.sender_name,
            phone: m.sender_id,
          },
          {
            id: m.recipient_id,
            name: m.recipient_name,
            phone: m.recipient_id,
          },
        ])
        .map((c) => [c.id, c])
    ).values()
  );

  const filteredMessages = mockMessages.filter((m) => {
    if (showSuspiciousOnly && !m.suspicious) return false;
    if (
      searchText &&
      !m.text.toLowerCase().includes(searchText.toLowerCase())
    )
      return false;
    return true;
  });

  const getRiskBg = (level?: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-100 border-red-300';
      case 'high':
        return 'bg-orange-100 border-orange-300';
      case 'medium':
        return 'bg-amber-100 border-amber-300';
      default:
        return 'bg-slate-100 border-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-slate-900">
              Chat Explorer
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h3 className="font-bold text-slate-900 mb-4">Contacts</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {contacts.map((contact) => {
                const contactMessages = mockMessages.filter(
                  (m) =>
                    m.sender_id === contact.id ||
                    m.recipient_id === contact.id
                );
                const suspiciousCount = contactMessages.filter(
                  (m) => m.suspicious
                ).length;

                return (
                  <div
                    key={contact.id}
                    className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition"
                  >
                    <p className="font-semibold text-sm text-slate-900">
                      {contact.name}
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      {contactMessages.length} messages
                    </p>
                    {suspiciousCount > 0 && (
                      <span className="inline-block mt-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                        ⚠️ {suspiciousCount}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="mb-6 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSuspiciousOnly}
                  onChange={(e) => setShowSuspiciousOnly(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-slate-700">
                  Show Only Suspicious Messages
                </span>
              </label>
            </div>

            <div className="bg-white rounded-lg border border-slate-200">
              {filteredMessages.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-600">No messages found</p>
                </div>
              ) : (
                <div className="space-y-1 max-h-screen overflow-y-auto">
                  {filteredMessages.map((message) => (
                    <div
                      key={message.id}
                      onClick={() => setSelectedMessage(message)}
                      className={`p-4 border-b border-slate-200 hover:bg-slate-50 cursor-pointer transition ${selectedMessage?.id === message.id ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-bold text-slate-900">
                              {message.sender_name}
                            </span>
                            <span className="text-xs text-slate-500">→</span>
                            <span className="text-sm text-slate-600">
                              {message.recipient_name}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">
                            {message.text.substring(0, 60)}
                            {message.text.length > 60 ? '...' : ''}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-slate-500">
                              {new Date(message.timestamp).toLocaleString()}
                            </span>
                            {message.media_ids.length > 0 && (
                              <span className="text-xs text-slate-500">
                                📎 {message.media_ids.length}
                              </span>
                            )}
                          </div>
                        </div>
                        {message.suspicious && (
                          <span
                            className={`px-2 py-1 text-xs font-bold rounded ${getRiskBg(message.risk_level)}`}
                          >
                            {message.risk_level?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      {message.cluster_id && (
                        <div className="mt-2 inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                          Cluster: {message.cluster_id}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {selectedMessage && (
          <div className="fixed right-0 top-0 h-screen w-80 bg-white border-l border-slate-200 shadow-lg z-40 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Message Details</h3>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1">
                  From
                </p>
                <p className="text-sm text-slate-900">
                  {selectedMessage.sender_name}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1">To</p>
                <p className="text-sm text-slate-900">
                  {selectedMessage.recipient_name}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1">
                  Timestamp
                </p>
                <p className="text-sm text-slate-900">
                  {new Date(selectedMessage.timestamp).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1">
                  Message
                </p>
                <p className="text-sm text-slate-900 bg-slate-50 p-3 rounded border border-slate-200">
                  {selectedMessage.text}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-600 mb-1">
                  Source App
                </p>
                <p className="text-sm text-slate-900">
                  {selectedMessage.source_app}
                </p>
              </div>

              {selectedMessage.rules_triggered.length > 0 && (
                <div className="bg-red-50 border border-red-200 p-3 rounded">
                  <p className="text-xs font-semibold text-red-900 mb-2">
                    Triggered Rules
                  </p>
                  <div className="space-y-2">
                    {selectedMessage.rules_triggered.map((rule) => (
                      <div key={rule.rule} className="text-xs">
                        <p className="font-semibold text-red-800">
                          {rule.description}
                        </p>
                        <p className="text-red-700 mt-1">
                          {(rule.confidence * 100).toFixed(0)}% confidence
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedMessage.cluster_id && (
                <div className="bg-purple-50 border border-purple-200 p-3 rounded">
                  <p className="text-xs font-semibold text-purple-900 mb-1">
                    Cluster
                  </p>
                  <p className="text-sm text-purple-700">
                    {selectedMessage.cluster_label}
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 space-y-2">
                <button
                  onClick={() => onNavigate('timeline')}
                  className="w-full px-3 py-2 text-sm bg-blue-50 border border-blue-200 text-blue-700 rounded hover:bg-blue-100 transition"
                >
                  View on Timeline →
                </button>
                {selectedMessage.media_ids.length > 0 && (
                  <button
                    onClick={() => onNavigate('media')}
                    className="w-full px-3 py-2 text-sm bg-orange-50 border border-orange-200 text-orange-700 rounded hover:bg-orange-100 transition"
                  >
                    Open Linked Media →
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
