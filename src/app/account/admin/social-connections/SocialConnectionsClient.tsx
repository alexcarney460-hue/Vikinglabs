'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Connection {
  id: string;
  platform: 'instagram' | 'tiktok';
  account_username: string;
  status: 'active' | 'revoked' | 'expired';
  created_at: string;
}

export default function SocialConnectionsClient() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    platform: 'instagram' as const,
    account_id: '',
    account_username: '',
    access_token: '',
    refresh_token: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadConnections();
  }, []);

  async function loadConnections() {
    try {
      const res = await fetch('/api/social/connections');
      const data = await res.json();
      setConnections(data.connections || []);
    } catch (err) {
      console.error('Failed to load connections:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleConnect() {
    if (!formData.account_id || !formData.access_token) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/social/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await loadConnections();
        setFormData({
          platform: 'instagram',
          account_id: '',
          account_username: '',
          access_token: '',
          refresh_token: '',
        });
        setShowForm(false);
        alert('Connection successful!');
      } else {
        alert('Failed to connect account');
      }
    } catch (err) {
      alert('Error connecting account');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDisconnect(id: string) {
    if (!confirm('Disconnect this account?')) return;

    try {
      await fetch('/api/social/connections', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      await loadConnections();
    } catch (err) {
      alert('Failed to disconnect');
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Connected Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {connections.map((conn) => (
          <Card key={conn.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="capitalize">{conn.platform}</span>
                <span className="text-sm font-normal bg-green-100 text-green-800 px-2 py-1 rounded">
                  {conn.status}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                <strong>Account:</strong> {conn.account_username}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Connected: {new Date(conn.created_at).toLocaleDateString()}
              </p>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDisconnect(conn.id)}
              >
                Disconnect
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Connection Form */}
      {!showForm ? (
        <Button onClick={() => setShowForm(true)} className="w-full">
          + Add Social Account
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Add Social Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Platform</label>
              <select
                value={formData.platform}
                onChange={(e) =>
                  setFormData({ ...formData, platform: e.target.value as 'instagram' | 'tiktok' })
                }
                className="w-full border rounded px-3 py-2"
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Account ID</label>
              <Input
                type="text"
                value={formData.account_id}
                onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                placeholder="Your account ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Username</label>
              <Input
                type="text"
                value={formData.account_username}
                onChange={(e) => setFormData({ ...formData, account_username: e.target.value })}
                placeholder="Your username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Access Token *</label>
              <Input
                type="password"
                value={formData.access_token}
                onChange={(e) => setFormData({ ...formData, access_token: e.target.value })}
                placeholder="Access token (required)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Refresh Token (optional)</label>
              <Input
                type="password"
                value={formData.refresh_token}
                onChange={(e) => setFormData({ ...formData, refresh_token: e.target.value })}
                placeholder="Refresh token"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleConnect}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? 'Connecting...' : 'Connect Account'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
