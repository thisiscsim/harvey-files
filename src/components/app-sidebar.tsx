"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { SvgIcon } from "@/components/svg-icon"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar"
import { 
  ChevronRight,
  Settings,
  Moon,
  Sun,
  Headphones,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/theme-provider"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Menu items with custom SVG icons from central_icons
const menuItems = [
  {
    title: "Home",
    href: "/assistant",
    iconOutline: "/central_icons/Home.svg",
    iconFilled: "/central_icons/Home - Filled.svg",
  },
  {
    title: "Inbox",
    href: "/inbox",
    iconOutline: "/central_icons/Inbox.svg",
    iconFilled: "/central_icons/Inbox - Filled.svg",
  },
  {
    title: "Files",
    href: "/files",
    iconOutline: "/central_icons/Vault.svg",
    iconFilled: "/central_icons/Vault - Filled.svg",
  },
  {
    title: "Spaces",
    href: "/spaces",
    iconOutline: "/central_icons/Spaces.svg",
    iconFilled: "/central_icons/Spaces - Filled.svg",
  },
  {
    title: "Workflows",
    href: "/workflows",
    iconOutline: "/central_icons/Workflows.svg",
    iconFilled: "/central_icons/Workflows-Filled.svg",
  },
  {
    title: "History",
    href: "/history",
    iconOutline: "/central_icons/History.svg",
    iconFilled: "/central_icons/History - Filled.svg",
  },
]

// Vault projects (first 5)
const vaultProjects = [
  { id: 1, name: "Stubhub IPO Filing", href: "/stubhub-ipo-filing" },
  { id: 2, name: "M&A (US)", href: "/vault/ma-us" },
  { id: 3, name: "Cross-Border Tax Strategies", href: "/vault/cross-border-tax" },
  { id: 4, name: "Reevo AI - Series B Financing", href: "/reevo-ai-series-b" },
  { id: 5, name: "Regulatory Compliance Audit", href: "/regulatory-compliance-audit" },
]

// Bottom menu items
const bottomMenuItems = [
  {
    title: "Library",
    href: "/library",
    iconOutline: "/central_icons/Library.svg",
    iconFilled: "/central_icons/Library - Filled.svg",
  },
  {
    title: "Guidance",
    href: "/guidance",
    iconOutline: "/central_icons/Guidance.svg",
    iconFilled: "/central_icons/Guidance - Filled.svg",
  },
]

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar()
  const { theme, toggleTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  const [isAvatarHovered, setIsAvatarHovered] = useState(false)
  const [isVaultOpen, setIsVaultOpen] = useState<boolean | null>(null)

  // Load vault open state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-vault-open')
    setIsVaultOpen(saved !== null ? saved === 'true' : true)
  }, [])

  // Persist vault open state to localStorage (only after initial load)
  useEffect(() => {
    if (isVaultOpen !== null) {
      localStorage.setItem('sidebar-vault-open', String(isVaultOpen))
    }
  }, [isVaultOpen])
  
  // Determine the selected item based on current path
  const getSelectedItem = () => {
    // Check if the current path is a vault sub-page
    if (pathname === "/vault" || pathname === "/stubhub-ipo-filing" || pathname === "/reevo-ai-series-b" || pathname === "/regulatory-compliance-audit" || pathname.startsWith("/vault/")) {
      return "Vault"
    }
    
    const allItems = [...menuItems, ...bottomMenuItems]
    const currentItem = allItems.find(item => item.href === pathname || pathname.startsWith(item.href + "/"))
    return currentItem?.title || "Home"
  }
  
  const selectedItem = getSelectedItem()
  
  // Reset hover state when sidebar state changes
  useEffect(() => {
    setIsAvatarHovered(false)
  }, [state])

  const handleNavigation = (href: string) => {
    router.push(href)
  }

  const renderMenuItem = (item: typeof menuItems[0], index: number) => (
    <SidebarMenuItem key={index}>
      <SidebarMenuButton
        tooltip={state === "collapsed" ? item.title : undefined}
        onClick={() => handleNavigation(item.href)}
        className={cn(
          "w-full justify-start gap-[6px] text-sm rounded-md transition-colors",
          state === "expanded" ? "px-2 h-[32px]" : "p-0 w-[32px] h-[32px] min-w-[32px] min-h-[32px] flex items-center justify-center",
          selectedItem === item.title ? "bg-bg-subtle-pressed hover:bg-bg-subtle-pressed" : "hover:bg-bg-subtle-hover"
        )}
      >
        <div className="w-5 h-5 flex items-center justify-center shrink-0">
          <SvgIcon
            src={selectedItem === item.title ? item.iconFilled : item.iconOutline}
            alt={item.title}
            width={18}
            height={18}
            className={selectedItem === item.title ? "text-fg-base" : "text-fg-subtle"}
          />
        </div>
        {state === "expanded" && (
          <span className={selectedItem === item.title ? "text-fg-base" : "text-fg-subtle"}>{item.title}</span>
        )}
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
  
  return (
    <Sidebar collapsible="icon" className="relative border-r border-border-base bg-bg-subtle">
      <SidebarHeader className={cn(
        "p-0 relative",
        state === "collapsed" && "group"
      )}>
        {/* Whitfield & Crane logo/avatar */}
        <div className={cn(
          "flex items-center h-14 transition-colors",
          state === "expanded" ? "px-2 gap-[6px]" : "px-2 justify-center"
        )}>
          {state === "expanded" ? (
            // Expanded state: avatar + name together with dropdown
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-[6px] min-w-0 flex-1 rounded-md px-2 h-[32px] hover:bg-bg-subtle-hover transition-colors">
                    <Image
                      src="/whitefield_logo.png"
                      alt="Whitfield & Crane LLP"
                      width={20}
                      height={20}
                      className="rounded-[4px] shrink-0"
                    />
                    <span className="text-sm font-medium text-fg-base truncate min-w-0">
                      Whitfield & Crane LLP
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-[200px]">
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleTheme}>
                    {theme === "light" ? (
                      <>
                        <Moon className="w-4 h-4" />
                        <span>Lights off</span>
                      </>
                    ) : (
                      <>
                        <Sun className="w-4 h-4" />
                        <span>Lights on</span>
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Headphones className="w-4 h-4" />
                    <span>Support</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <button
                onClick={toggleSidebar}
                className="shrink-0 w-[32px] h-[32px] rounded-md hover:bg-bg-subtle-hover transition-colors flex items-center justify-center"
              >
                <SvgIcon 
                  src="/central_icons/LeftSidebar - Filled.svg" 
                  alt="Close sidebar"
                  width={18}
                  height={18}
                  className="text-fg-subtle"
                />
              </button>
            </>
          ) : (
            // Collapsed state: just avatar with expand tooltip
            <button 
              onClick={toggleSidebar}
              onMouseEnter={() => setIsAvatarHovered(true)}
              onMouseLeave={() => setIsAvatarHovered(false)}
              className={cn(
                "shrink-0 w-[32px] h-[32px] rounded-md transition-colors flex items-center justify-center relative",
                "hover:bg-bg-subtle-hover"
              )}
            >
              {isAvatarHovered ? (
                <SvgIcon 
                  src="/central_icons/LeftSidebar.svg" 
                  alt="Open sidebar"
                  width={18}
                  height={18}
                  className="text-fg-subtle"
                />
              ) : (
                <Image
                  src="/whitefield_logo.png"
                  alt="Whitfield & Crane LLP"
                  width={20}
                  height={20}
                  className="rounded-[4px]"
                />
              )}
              {isAvatarHovered && (
                <div className="absolute left-full ml-2 bg-bg-interactive text-fg-on-color rounded-md px-2 py-1 shadow-md whitespace-nowrap z-50">
                  <span className="text-xs">
                    Expand sidebar
                  </span>
                </div>
              )}
            </button>
          )}
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-bg-subtle">
        <SidebarGroup className="p-0">
          <SidebarGroupContent>
            <SidebarMenu className={cn(
              "gap-1 py-2",
              state === "expanded" ? "px-2" : "px-2"
            )}>
              {/* Regular menu items */}
              {menuItems.map((item, index) => renderMenuItem(item, index))}
              
              {/* Bottom menu items */}
              {bottomMenuItems.map((item, index) => renderMenuItem(item, index + menuItems.length + 1))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
