"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

type Team = {
  id: string;
  name: string;
  logoUrl: string | null;
  owner: { id: string; name: string | null; email: string };
  players: Array<{ id: string; name: string; jerseyNumber: number | null }>;
};

type PlayerInput = { name: string; jerseyNumber: string };

export function TeamManager({ teams, currentUserId, role }: { teams: Team[]; currentUserId: string; role: string }) {
  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [players, setPlayers] = useState<PlayerInput[]>([{ name: "", jerseyNumber: "" }]);
  const [loading, setLoading] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editPlayers, setEditPlayers] = useState<PlayerInput[]>([{ name: "", jerseyNumber: "" }]);
  const [savingEdit, setSavingEdit] = useState(false);

  const canCreate = useMemo(() => !!currentUserId, [currentUserId]);

  const addPlayer = () => setPlayers((prev) => [...prev, { name: "", jerseyNumber: "" }]);
  const removePlayer = (index: number) =>
    setPlayers((prev) => prev.filter((_, idx) => idx !== index));

  const updatePlayer = (index: number, key: "name" | "jerseyNumber", value: string) => {
    setPlayers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const resetForm = () => {
    setName("");
    setLogoUrl("");
    setPlayers([{ name: "", jerseyNumber: "" }]);
  };

  const startEdit = (team: Team) => {
    setEditingTeamId(team.id);
    setEditName(team.name);
    setEditLogoUrl(team.logoUrl ?? "");
    setEditPlayers(
      team.players.length
        ? team.players.map((player) => ({
            name: player.name,
            jerseyNumber: player.jerseyNumber ? String(player.jerseyNumber) : "",
          }))
        : [{ name: "", jerseyNumber: "" }],
    );
  };

  const cancelEdit = () => {
    setEditingTeamId(null);
    setEditName("");
    setEditLogoUrl("");
    setEditPlayers([{ name: "", jerseyNumber: "" }]);
  };

  const addEditPlayer = () =>
    setEditPlayers((prev) => [...prev, { name: "", jerseyNumber: "" }]);

  const removeEditPlayer = (index: number) =>
    setEditPlayers((prev) => prev.filter((_, idx) => idx !== index));

  const updateEditPlayer = (index: number, key: "name" | "jerseyNumber", value: string) => {
    setEditPlayers((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const handleLogoFileChange = (file: File | null) => {
    if (!file) {
      setLogoUrl("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setLogoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const handleEditLogoFileChange = (file: File | null) => {
    if (!file) {
      setEditLogoUrl("");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setEditLogoUrl(result);
    };
    reader.readAsDataURL(file);
  };

  const createTeam = async () => {
    setLoading(true);
    try {
      const payload = {
        name,
        logoUrl,
        players: players
          .filter((p) => p.name.trim())
          .map((p) => ({
            name: p.name.trim(),
            jerseyNumber: p.jerseyNumber ? Number(p.jerseyNumber) : undefined,
          })),
      };

      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Could not create team");
      }

      toast.success("Team registered");
      resetForm();
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Team creation failed");
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = async (id: string) => {
    const res = await fetch(`/api/teams/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Could not delete team");
      return;
    }
    toast.success("Team deleted");
    window.location.reload();
  };

  const saveEdit = async (id: string) => {
    setSavingEdit(true);
    try {
      const payload = {
        name: editName,
        logoUrl: editLogoUrl,
        players: editPlayers
          .filter((p) => p.name.trim())
          .map((p) => ({
            name: p.name.trim(),
            jerseyNumber: p.jerseyNumber ? Number(p.jerseyNumber) : undefined,
          })),
      };

      const res = await fetch(`/api/teams/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Could not update team");
      }

      toast.success("Team updated");
      cancelEdit();
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="lg:col-span-2 rounded-xl border bg-white p-5 shadow-sm dark:bg-slate-900">
        <h2 className="mb-4 text-lg font-semibold">Register Team</h2>
        {!canCreate ? (
          <p className="text-sm text-red-500">Sign in to create a team.</p>
        ) : (
          <div className="space-y-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Team name" className="w-full rounded-md border px-3 py-2" />
            <div className="space-y-2">
              <label className="block text-sm font-medium">Team logo image (optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleLogoFileChange(e.target.files?.[0] ?? null)}
                className="w-full rounded-md border px-3 py-2 text-sm"
              />
              {logoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt="Team logo preview"
                  className="h-14 w-14 rounded-md border object-cover"
                />
              )}
            </div>

            <div className="space-y-2">
              {players.map((player, index) => (
                <div className="grid grid-cols-3 gap-2" key={index}>
                  <input
                    value={player.name}
                    onChange={(e) => updatePlayer(index, "name", e.target.value)}
                    placeholder={`Player ${index + 1} name`}
                    className="col-span-2 rounded-md border px-3 py-2"
                  />
                  <input
                    value={player.jerseyNumber}
                    onChange={(e) => updatePlayer(index, "jerseyNumber", e.target.value)}
                    placeholder="#"
                    className="rounded-md border px-3 py-2"
                  />
                  <button
                    type="button"
                    onClick={() => removePlayer(index)}
                    className="col-span-3 rounded-md border border-red-300 px-2 py-1 text-xs text-red-500"
                  >
                    Remove player
                  </button>
                </div>
              ))}
            </div>

            <button type="button" onClick={addPlayer} className="rounded-md border px-3 py-2 text-sm hover:bg-primary/10">
              + Add Player
            </button>

            <button
              type="button"
              disabled={loading || !name.trim()}
              onClick={createTeam}
              className="w-full rounded-md bg-primary px-3 py-2 font-semibold text-primary-foreground"
            >
              {loading ? "Saving..." : "Create Team"}
            </button>
          </div>
        )}
      </section>

      <section className="lg:col-span-3 space-y-4">
        <h2 className="text-lg font-semibold">Registered Teams</h2>
        {teams.map((team) => {
          const canManage = role === "admin" || team.owner.id === currentUserId;
          return (
            <div key={team.id} className="animate-slide-up rounded-xl border bg-white p-4 shadow-sm dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    {team.logoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={team.logoUrl}
                        alt={`${team.name} logo`}
                        className="h-10 w-10 rounded-full border object-cover"
                      />
                    )}
                    <h3 className="text-lg font-semibold">{team.name}</h3>
                  </div>
                  <p className="text-xs text-gray-500">Owner / Creator: {team.owner.name ?? team.owner.email}</p>
                  <p className="mt-2 text-sm">Players: {team.players.map((p) => p.name).join(", ") || "None"}</p>
                </div>
                {canManage && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(team)}
                      className="rounded-md border border-primary/40 px-3 py-1 text-sm text-primary"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTeam(team.id)}
                      className="rounded-md border border-red-400 px-3 py-1 text-sm text-red-500"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
              {canManage && editingTeamId === team.id && (
                <div className="mt-4 space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <h4 className="text-sm font-semibold">Edit Team</h4>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Team name"
                    className="w-full rounded-md border px-3 py-2"
                  />
                  <div className="space-y-2">
                    <label className="block text-sm font-medium">Change team logo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleEditLogoFileChange(e.target.files?.[0] ?? null)}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    {editLogoUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={editLogoUrl}
                        alt="Edited team logo preview"
                        className="h-14 w-14 rounded-md border object-cover"
                      />
                    )}
                  </div>
                  <div className="space-y-2">
                    {editPlayers.map((player, index) => (
                      <div className="grid grid-cols-3 gap-2" key={`edit-${index}`}>
                        <input
                          value={player.name}
                          onChange={(e) => updateEditPlayer(index, "name", e.target.value)}
                          placeholder={`Player ${index + 1} name`}
                          className="col-span-2 rounded-md border px-3 py-2"
                        />
                        <input
                          value={player.jerseyNumber}
                          onChange={(e) => updateEditPlayer(index, "jerseyNumber", e.target.value)}
                          placeholder="#"
                          className="rounded-md border px-3 py-2"
                        />
                        <button
                          type="button"
                          onClick={() => removeEditPlayer(index)}
                          className="col-span-3 rounded-md border border-red-300 px-2 py-1 text-xs text-red-500"
                        >
                          Remove player
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addEditPlayer}
                      className="rounded-md border px-3 py-2 text-sm hover:bg-primary/10"
                    >
                      + Add Team Member
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={savingEdit || !editName.trim()}
                      onClick={() => saveEdit(team.id)}
                      className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
                    >
                      {savingEdit ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="rounded-md border px-3 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
