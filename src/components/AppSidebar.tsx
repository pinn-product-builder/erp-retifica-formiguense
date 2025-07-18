import { Calendar, Home, Inbox, Search, Settings, ClipboardCheck, Truck, DollarSign, Kanban } from "lucide-react"
import { NavLink } from "react-router-dom"

import { cn } from "@/lib/utils"

interface AppSidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

const items = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Check-in Técnico",
    url: "/checkin",
    icon: ClipboardCheck,
  },
  {
    title: "Coleta de Motor",
    url: "/coleta",
    icon: Truck,
  },
  {
    title: "Workflow Kanban",
    url: "/workflow",
    icon: Kanban,
  },
  {
    title: "Orçamentos",
    url: "/orcamentos",
    icon: DollarSign,
  },
];

const AppSidebar = React.forwardRef<HTMLDivElement, AppSidebarProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        className={cn(
          "flex flex-col gap-2 bg-secondary text-secondary-foreground rounded-md p-4 w-60",
          className
        )}
        ref={ref}
        {...props}
      >
        <div className="font-bold">Menu</div>
        <nav className="grid gap-2">
          {items.map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md p-2 hover:bg-muted/80",
                  isActive ? "bg-muted/50 font-semibold" : "bg-transparent"
                )
              }
            >
              <item.icon className="w-4 h-4" />
              {item.title}
            </NavLink>
          ))}
        </nav>
      </div>
    )
  }
)
AppSidebar.displayName = "AppSidebar"

export { AppSidebar }
