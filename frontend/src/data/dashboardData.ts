export interface SidebarLink {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

export interface TeamMember {
  initials: string;
  name: string;
  role: string;
}

export interface Service {
  id: number;
  name: string;
  icon: string;
  status: string;
  estimatedWait: number;
}

export const sidebarLinks: SidebarLink[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: "🖥️",
    end: true,
  },
  {
    to: "/join-queue",
    label: "Join Queue",
    icon: "➕",
  },
  {
    to: "/queue-status",
    label: "Queue Status",
    icon: "⏳",
  },
  {
    to: "/history",
    label: "History",
    icon: "🕧",
  },
  {
    to: "/notifications",
    label: "Notifications",
    icon: "🔔",
  },
];

export const teamMembers: TeamMember[] = [
  {
    initials: "AL",
    name: "Andy L. Do",
    role: "Team Member 1",
  },
  {
    initials: "AK",
    name: "Ayush Kharel",
    role: "Team Member 2",
  },
  {
    initials: "NT",
    name: "Ngoc Thang Nguyen",
    role: "Team Member 3",
  },
  {
    initials: "TH",
    name: "Tom Hoang",
    role: "Team Member 4",
  },
];

export const services: Service[] = [
  {
    id: 1,
    name: "Academic Advising",
    icon: "👨🏻‍🏫",
    status: "Open",
    estimatedWait: 15,
  },
  {
    id: 2,
    name: "IT Help Desk",
    icon: "🧑🏻‍💻",
    status: "Open",
    estimatedWait: 15,
  },
  {
    id: 3,
    name: "Financial Aid",
    icon: "🏦",
    status: "Open",
    estimatedWait: 25,
  },
];
