interface MobileBottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenDesk: () => void;
}

const navItems = [
  { id: "map", label: "Map" },
  { id: "analytics", label: "Stats" },
  { id: "desk", label: "Desk" },
  { id: "cities", label: "Cities" },
] as const;

const MobileBottomNav = ({ activeTab, onTabChange, onOpenDesk }: MobileBottomNavProps) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid h-14 grid-cols-4">
        {navItems.map((item) => {
          const isActive = item.id === "desk" ? false : activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id === "desk") {
                  onOpenDesk();
                  return;
                }
                onTabChange(item.id);
              }}
              className={`tap-target flex flex-col items-center justify-center text-xs ${
                isActive ? "bg-muted text-foreground" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
