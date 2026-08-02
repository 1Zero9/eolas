'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type Workspace = { id: string; name: string; slug: string };

export default function WorkspaceSwitcher() {
  const pathname = usePathname();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeId, setActiveId] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (pathname.startsWith('/login')) return;
    void fetch('/api/organizations')
      .then(async (response) => response.ok ? response.json() : [])
      .then((items: Workspace[]) => setWorkspaces(items));
  }, [pathname]);

  useEffect(() => {
    if (!workspaces.length || activeId) return;
    void fetch('/api/organizations/active')
      .then(async (response) => response.ok ? response.json() : null)
      .then((workspace: Workspace | null) => setActiveId(workspace?.id || workspaces[0].id));
  }, [activeId, workspaces]);

  async function changeWorkspace(id: string) {
    if (!id || id === activeId) return;
    const previous = activeId;
    setActiveId(id); setBusy(true);
    try {
      const response = await fetch('/api/organizations/active', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      if (!response.ok) throw new Error('Unable to select workspace');
      router.refresh();
    } catch { setActiveId(previous); }
    finally { setBusy(false); }
  }

  if (pathname.startsWith('/login') || !workspaces.length) return null;
  return <label className="workspace-switcher"><span>Workspace</span><select aria-label="Active workspace" value={activeId} disabled={busy} onChange={(event) => void changeWorkspace(event.target.value)}>{workspaces.map((workspace) => <option key={workspace.id} value={workspace.id}>{workspace.name}</option>)}</select></label>;
}
