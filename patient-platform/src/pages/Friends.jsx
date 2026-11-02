import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { UserPlus, Users, Search, Loader2, Check, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function Friends() {
  const [user, setUser] = useState(null);
  const [connections, setConnections] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [relationship, setRelationship] = useState("friend");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const u = await base44.auth.me();
    setUser(u);
    
    const allConnections = await base44.entities.Connection.list("-created_date", 200);
    
    // My connections (where I'm the initiator or the friend, and status is accepted)
    const myConnections = allConnections.filter(
      (c) => c.status === "accepted" && (c.user_email === u.email || c.friend_email === u.email)
    );
    setConnections(myConnections);
    
    // Pending requests sent to me
    const pending = allConnections.filter(
      (c) => c.status === "pending" && c.friend_email === u.email
    );
    setPendingRequests(pending);
    
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    const res = await base44.functions.invoke("searchUsersForDiscovery", { query: searchQuery, limit: 20 });
    
    const results = res.data?.results || [];
    
    setSearchResults(results);
    setSearching(false);
  };

  const handleAddFriend = async (friendUser) => {
    // Check if already connected or pending
    const allConnections = await base44.entities.Connection.list();
    const existing = allConnections.find(
      (c) => 
        (c.user_email === user.email && c.friend_email === friendUser.email) ||
        (c.user_email === friendUser.email && c.friend_email === user.email)
    );
    
    if (existing) {
      toast.error("Connection already exists");
      return;
    }
    
    await base44.entities.Connection.create({
      user_email: user.email,
      friend_email: friendUser.email,
      friend_name: friendUser.is_anonymous ? (friendUser.display_name || "Anonymous") : friendUser.full_name,
      status: "pending",
      relationship,
    });
    
    toast.success("Connection request sent");
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleAccept = async (connection) => {
    await base44.entities.Connection.update(connection.id, { status: "accepted" });
    toast.success("Connection accepted");
    await loadData();
  };

  const handleDecline = async (connection) => {
    await base44.entities.Connection.update(connection.id, { status: "declined" });
    toast.success("Connection declined");
    await loadData();
  };

  const handleRemove = async (connection) => {
    await base44.entities.Connection.delete(connection.id);
    toast.success("Connection removed");
    await loadData();
  };

  const getConnectionName = (connection) => {
    if (connection.user_email === user.email) {
      return connection.nickname || connection.friend_name;
    } else {
      // Find the name of the person who sent me the request
      return connection.nickname || connection.friend_name;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Friends & Family</h1>
        <p className="text-sm text-slate-400 mt-1">Connect with loved ones for support</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
            <UserPlus className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Add Connection</h3>
            <p className="text-xs text-slate-400">Search by email or username</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by email or name..."
                className="pl-10 h-11 rounded-xl border-slate-200"
              />
            </div>
            <Select value={relationship} onValueChange={setRelationship}>
              <SelectTrigger className="w-32 h-11 rounded-xl border-slate-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="friend">Friend</SelectItem>
                <SelectItem value="family">Family</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={searching || !searchQuery.trim()} className="h-11 rounded-xl bg-teal-600 hover:bg-teal-700 px-6">
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
            </Button>
          </div>
        </form>

        {searchResults.length > 0 && (
          <div className="mt-4 space-y-2">
            {searchResults.map((result) => (
              <div key={result.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                    {result.full_name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {result.is_anonymous ? (result.display_name || "Anonymous User") : result.full_name}
                    </p>
                    <p className="text-xs text-slate-400">{result.email}</p>
                  </div>
                </div>
                <Button onClick={() => handleAddFriend(result)} size="sm" className="h-8 rounded-lg bg-teal-600 hover:bg-teal-700 text-xs">
                  Add
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
          <h3 className="text-base font-semibold text-slate-900 mb-4">Pending Requests ({pendingRequests.length})</h3>
          <div className="space-y-2">
            {pendingRequests.map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold">
                    {req.friend_name?.charAt(0) || "?"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{req.friend_name}</p>
                    <p className="text-xs text-slate-400">Wants to connect as {req.relationship}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleAccept(req)} size="sm" className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs gap-1">
                    <Check className="w-3 h-3" /> Accept
                  </Button>
                  <Button onClick={() => handleDecline(req)} size="sm" variant="outline" className="h-8 rounded-lg text-xs">
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Connections */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">My Connections</h3>
            <p className="text-xs text-slate-400">{connections.length} connected</p>
          </div>
        </div>

        {connections.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No connections yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {connections.map((conn) => {
              const isInitiator = conn.user_email === user.email;
              const relationshipColors = {
                friend: "bg-blue-100 text-blue-700",
                family: "bg-rose-100 text-rose-700",
                other: "bg-slate-100 text-slate-600",
              };
              
              return (
                <div key={conn.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                      {getConnectionName(conn).charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">{getConnectionName(conn)}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${relationshipColors[conn.relationship]}`}>
                          {conn.relationship}
                        </span>
                        <span className="text-xs text-slate-400">
                          {isInitiator ? "You added" : "Added you"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button onClick={() => handleRemove(conn)} size="sm" variant="ghost" className="text-red-400 hover:text-red-600 hover:bg-red-50 text-xs">
                    Remove
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}