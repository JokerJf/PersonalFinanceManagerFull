import { useApp, Workspace } from "@/context/AppContext";

const WorkspaceSwitcher = () => {
  const { workspace, setWorkspace, familyEnabled } = useApp();

  if (!familyEnabled) return null;

  return (
    <div className="flex rounded-2xl p-1 gap-1">
      {(["personal", "family"] as Workspace[]).map((w) => (
        <button
          key={w}
          onClick={() => setWorkspace(w)}
          className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${workspace === w ? "tab-active" : "tab-inactive"}`}
        >
          {w === "personal" ? "Personal" : "Family"}
        </button>
      ))}
    </div>
  );
};

export default WorkspaceSwitcher;
